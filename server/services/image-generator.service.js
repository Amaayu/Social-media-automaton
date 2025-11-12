const axios = require('axios');

/**
 * Ultra Enhanced Image Generator Service 🎨
 * Produces card-style, infographic, and diagram-rich visuals with text, flows, and tech explanations.
 * Focused on clean, professional design that looks like a designed Figma/Notion-style canvas.
 */
class ImageGeneratorService {
  constructor() {
    this.initialized = false;
    this.apiKey = null;
    this.modelId = 'gemini-2.5-flash-image';
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  }

  /**
   * Initialize with Gemini API key
   */
  initialize(apiKey) {
    if (!apiKey) throw new Error('Gemini API key is required for image generation');
    this.apiKey = apiKey.toString().trim();
    this.initialized = true;
    console.log('[ImageGeneratorService] Initialized in Designer Canvas Mode 🎨');
  }

  /**
   * Generate image using Gemini 2.5 Flash Image
   * @param {string} rawPrompt - Caption or topic description
   * @returns {Buffer} Image buffer
   */
  async generateImage(rawPrompt) {
    if (!this.initialized) throw new Error('Image generator not initialized');

    // ✨ Enrich prompt for canvas-style visuals
    const enrichedPrompt = this.enrichPrompt(rawPrompt);

    try {
      console.log('[ImageGeneratorService] Generating canvas-style infographic with Gemini...');
      
      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [{ text: enrichedPrompt }]
          }
        ],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: {
            image_size: '1K', // 1024x1024, perfect square for Instagram
            quality: 'high',
            style: 'illustrative'
          }
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/models/${this.modelId}:generateContent?key=${this.apiKey}`,
        requestBody,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000
        }
      );

      const imageData = this.extractImageFromResponse(response.data);
      if (!imageData) throw new Error('No image data in Gemini response');

      const imageBuffer = Buffer.from(imageData, 'base64');
      console.log('[ImageGeneratorService] 🖼️ Canvas card generated successfully');
      console.log(`📦 Image size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
      return imageBuffer;

    } catch (error) {
      console.error('[ImageGeneratorService] Gemini generation failed:', error.message);
      console.log('[ImageGeneratorService] Falling back to Pollinations.ai...');
      return await this.generateImageWithPollinations(enrichedPrompt);
    }
  }

  /**
   * ✏️ Enrich prompt with design and layout instructions
   */
  enrichPrompt(rawPrompt) {
    return `
${rawPrompt}

🎨 Visual Objective:
Create a **stylish, text-inclusive infographic or tech explainer card** that looks like a modern canvas layout.

🧩 Composition:
- Clean minimal white or light-gray background
- Title at the top (e.g. "Understanding APIs", "How Databases Scale", etc.)
- Use **text boxes**, **flow arrows**, **short annotations**, and **highlighted examples**
- Balanced spacing, clear hierarchy
- Show labeled blocks or diagrams with short text like: “User”, “Server”, “Database”
- Use rounded rectangles, thin arrows, and clean icons
- Represent connections using flow lines and color-coded paths
- Include small human-readable text (2–5 lines per section)
- Should look like a designed Notion, Figma, or Canva card

🎨 Design Style:
- Minimalist, futuristic tech card aesthetic
- Color palette: white background, with blue, gray, purple, or teal accents
- Fonts: sleek sans-serif (Readable)
- Subtle drop shadows and consistent padding
- Avoid clutter — focus on clarity

🧠 Content Focus:
- Visually explain the concept step-by-step using examples or flows
- Include diagrammatic storytelling (like data flow, architecture, request lifecycle, etc.)
- Ensure text and graphics are readable and informative

🚫 Avoid:
- Abstract AI brains, robots, or random glowing patterns
- Excessive lighting effects or chaotic details
- Pure photo-realistic scenes
- Tiny unreadable text or dark cluttered backgrounds

📐 Output Format:
A 1:1 square infographic (1080x1080 or 1024x1024)
with text, diagram flows, labeled shapes, and short educational notes.
`.trim();
  }

  /**
   * Extract base64 image data from Gemini response
   */
  extractImageFromResponse(responseData) {
    try {
      const candidate = responseData.candidates?.[0];
      const parts = candidate?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) return part.inlineData.data;
      }
      return null;
    } catch (error) {
      console.error('[ImageGeneratorService] Failed to extract image:', error.message);
      return null;
    }
  }

  /**
   * 🌐 Fallback: Pollinations.ai for infographic-style consistency
   */
  async generateImageWithPollinations(prompt) {
    try {
      console.log('[ImageGeneratorService] Using Pollinations.ai fallback (Canvas Mode)...');
      
      const encodedPrompt = encodeURIComponent(`
${prompt},
infographic, minimalistic card layout, clean canvas, labeled diagrams,
text sections, arrows, examples, blue-gray color scheme, white background,
UI/UX infographic, educational slide for Instagram.
`);

      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1080&height=1080&nologo=true&enhance=true`;
      
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 60000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TechCanvasBot/1.0)' }
      });

      const imageBuffer = Buffer.from(response.data);
      console.log('[ImageGeneratorService] Pollinations fallback succeeded 🎨');
      console.log(`📦 Image size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
      return imageBuffer;

    } catch (error) {
      console.error('[ImageGeneratorService] Pollinations fallback failed:', error.message);
      throw new Error(`Failed to generate image: ${error.message}`);
    }
  }

  /**
   * Save image to temporary folder
   */
  async saveImageToTemp(imageBuffer, filename = 'generated-canvas.jpg') {
    const fs = require('fs').promises;
    const path = require('path');
    const tempDir = path.join(__dirname, '../../temp');
    
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch (e) {}

    const filepath = path.join(tempDir, filename);
    await fs.writeFile(filepath, imageBuffer);
    console.log(`[ImageGeneratorService] 🗂️ Image saved to ${filepath}`);
    return filepath;
  }
}

module.exports = ImageGeneratorService;
