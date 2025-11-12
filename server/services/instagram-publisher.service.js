const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

/**
 * Instagram Content Publisher Service
 * Handles publishing images to Instagram using official Graph API
 */
class InstagramPublisherService {
  constructor() {
    this.baseUrl = 'https://graph.instagram.com/v21.0';
    this.accessToken = null;
    this.instagramAccountId = null;
  }

  /**
   * Initialize with credentials
   */
  initialize(accessToken, instagramAccountId) {
    this.accessToken = accessToken;
    this.instagramAccountId = instagramAccountId;
  }

  /**
   * Upload image to a public server (required by Instagram API)
   * For production, you'd use AWS S3, Cloudinary, etc.
   * For now, we'll use a temporary solution
   */
  async uploadImageToPublicServer(imageBuffer, filename) {
    // In production, upload to your CDN/cloud storage
    // For this implementation, we'll use a temporary file server approach
    
    // Option 1: Use imgbb (free image hosting)
    try {
      const formData = new FormData();
      formData.append('image', imageBuffer.toString('base64'));
      
      const response = await axios.post('https://api.imgbb.com/1/upload', formData, {
        params: {
          key: process.env.IMGBB_API_KEY || '7d8c5d8c5d8c5d8c5d8c5d8c5d8c5d8c' // Get free key from imgbb.com
        },
        headers: formData.getHeaders()
      });

      return response.data.data.url;
    } catch (error) {
      console.error('[InstagramPublisherService] Failed to upload to imgbb:', error.message);
      
      // Fallback: Use Cloudinary (also free tier available)
      return await this.uploadToCloudinary(imageBuffer, filename);
    }
  }

  /**
   * Alternative: Upload to Cloudinary
   */
  async uploadToCloudinary(imageBuffer, filename) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary credentials not configured. Please set CLOUDINARY_* environment variables.');
    }

    const formData = new FormData();
    formData.append('file', imageBuffer, filename);
    formData.append('upload_preset', 'ml_default'); // or your preset
    
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData,
      {
        headers: formData.getHeaders()
      }
    );

    return response.data.secure_url;
  }

  /**
   * Step 1: Create media container
   */
  async createMediaContainer(imageUrl, caption, location = null) {
    try {
      console.log('[InstagramPublisherService] Creating media container...');
      
      // Ensure caption is properly formatted
      const cleanCaption = caption ? String(caption).trim() : '';
      
      const params = {
        access_token: this.accessToken,
        image_url: imageUrl,
        caption: cleanCaption
      };
      
      // Add location if provided and valid (location_id must be a valid Instagram location page ID)
      // Note: Location feature is disabled by default as it requires valid Instagram location IDs
      // To enable: Get location_id from Instagram's location search API first
      if (location && String(location).trim()) {
        console.log(`[InstagramPublisherService] Adding location: ${location}`);
        params.location_id = location;
      }
      
      const response = await axios.post(
        `${this.baseUrl}/${this.instagramAccountId}/media`,
        null,
        { params }
      );

      const containerId = response.data.id;
      console.log(`[InstagramPublisherService] Container created: ${containerId}`);
      
      return containerId;
    } catch (error) {
      throw new Error(`Failed to create media container: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Step 2: Check container status
   */
  async checkContainerStatus(containerId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${containerId}`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'status_code,status'
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to check container status: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Step 3: Publish media container
   */
  async publishMediaContainer(containerId) {
    try {
      console.log('[InstagramPublisherService] Publishing media container...');
      
      const response = await axios.post(
        `${this.baseUrl}/${this.instagramAccountId}/media_publish`,
        null,
        {
          params: {
            access_token: this.accessToken,
            creation_id: containerId
          }
        }
      );

      const mediaId = response.data.id;
      console.log(`[InstagramPublisherService] Post published successfully: ${mediaId}`);
      
      return mediaId;
    } catch (error) {
      throw new Error(`Failed to publish media: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Complete workflow: Upload image and publish to Instagram
   */
  async publishPost(imageBuffer, caption, filename = 'post.jpg', location = null) {
    try {
      // Step 1: Upload image to public server
      console.log('[InstagramPublisherService] Uploading image to public server...');
      const imageUrl = await this.uploadImageToPublicServer(imageBuffer, filename);
      console.log(`[InstagramPublisherService] Image uploaded: ${imageUrl}`);

      // Step 2: Create media container with location
      const containerId = await this.createMediaContainer(imageUrl, caption, location);

      // Step 3: Wait for container to be ready (Instagram processes the image)
      console.log('[InstagramPublisherService] Waiting for container to be ready...');
      await this.waitForContainerReady(containerId);

      // Step 4: Publish the container
      const mediaId = await this.publishMediaContainer(containerId);

      return {
        success: true,
        mediaId,
        imageUrl,
        message: 'Post published successfully to Instagram'
      };
    } catch (error) {
      console.error('[InstagramPublisherService] Publish failed:', error.message);
      throw error;
    }
  }

  /**
   * Wait for container to be ready before publishing
   */
  async waitForContainerReady(containerId, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.checkContainerStatus(containerId);
      
      if (status.status_code === 'FINISHED') {
        console.log('[InstagramPublisherService] Container is ready');
        return true;
      }
      
      if (status.status_code === 'ERROR') {
        throw new Error(`Container processing failed: ${status.status}`);
      }

      // Wait 2 seconds before checking again
      console.log(`[InstagramPublisherService] Container status: ${status.status_code}, waiting...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Container processing timeout');
  }

  /**
   * Check publishing rate limit
   */
  async checkPublishingLimit() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${this.instagramAccountId}/content_publishing_limit`,
        {
          params: {
            access_token: this.accessToken,
            fields: 'quota_usage,config'
          }
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to check publishing limit: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

module.exports = InstagramPublisherService;
