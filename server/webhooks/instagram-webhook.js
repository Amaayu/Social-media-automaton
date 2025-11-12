const express = require('express');
const crypto = require('crypto');

/**
 * Instagram Webhook Handler
 * Receives real-time updates for comments, messages, and mentions
 * 
 * Setup:
 * 1. Configure webhook in Meta App Dashboard
 * 2. Subscribe to: comments, messages, messaging_postbacks
 * 3. Set webhook URL: https://yourdomain.com/webhooks/instagram
 * 4. Set verify token in .env: INSTAGRAM_WEBHOOK_VERIFY_TOKEN
 */

const router = express.Router();

const VERIFY_TOKEN = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || 'your_verify_token_here';
const APP_SECRET = process.env.FACEBOOK_APP_SECRET;

/**
 * Webhook verification (GET request from Meta)
 * Meta will call this to verify your webhook endpoint
 */
router.get('/instagram', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[Webhook] Verification successful');
    res.status(200).send(challenge);
  } else {
    console.error('[Webhook] Verification failed');
    res.sendStatus(403);
  }
});

/**
 * Verify webhook signature
 * Ensures the request actually came from Meta
 */
function verifySignature(req) {
  const signature = req.headers['x-hub-signature-256'];
  
  if (!signature) {
    console.error('[Webhook] No signature found');
    return false;
  }
  
  const elements = signature.split('=');
  const signatureHash = elements[1];
  
  const expectedHash = crypto
    .createHmac('sha256', APP_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  return signatureHash === expectedHash;
}

/**
 * Webhook event handler (POST request from Meta)
 * Receives real-time updates
 */
router.post('/instagram', express.json(), (req, res) => {
  // Verify signature
  if (APP_SECRET && !verifySignature(req)) {
    console.error('[Webhook] Invalid signature');
    return res.sendStatus(403);
  }
  
  const body = req.body;
  
  // Check if this is a page subscription
  if (body.object === 'instagram') {
    // Process each entry
    body.entry.forEach(entry => {
      // Get the webhook event
      const webhookEvent = entry.changes?.[0] || entry.messaging?.[0];
      
      if (!webhookEvent) {
        console.log('[Webhook] No event data found');
        return;
      }
      
      // Handle different event types
      handleWebhookEvent(webhookEvent, entry);
    });
    
    // Return 200 OK to acknowledge receipt
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

/**
 * Process webhook events
 */
function handleWebhookEvent(event, entry) {
  const field = event.field;
  const value = event.value;
  
  console.log(`[Webhook] Received event: ${field}`);
  
  switch (field) {
    case 'comments':
      handleCommentEvent(value);
      break;
      
    case 'messages':
      handleMessageEvent(event);
      break;
      
    case 'messaging_postbacks':
      handlePostbackEvent(event);
      break;
      
    case 'mentions':
      handleMentionEvent(value);
      break;
      
    default:
      console.log(`[Webhook] Unhandled event type: ${field}`);
  }
}

/**
 * Handle new comment events
 */
function handleCommentEvent(value) {
  const commentId = value.id;
  const mediaId = value.media?.id;
  const text = value.text;
  const from = value.from;
  
  console.log('[Webhook] New comment received:');
  console.log(`  Comment ID: ${commentId}`);
  console.log(`  Media ID: ${mediaId}`);
  console.log(`  From: ${from?.username || from?.id}`);
  console.log(`  Text: ${text}`);
  
  // TODO: Implement your comment handling logic here
  // Example: Check if comment matches trigger keywords
  // Example: Auto-reply with DM
  // Example: Store in database for processing
  
  // Emit event for your application to handle
  if (global.eventEmitter) {
    global.eventEmitter.emit('instagram:comment', {
      commentId,
      mediaId,
      text,
      from,
      timestamp: new Date()
    });
  }
}

/**
 * Handle direct message events
 */
function handleMessageEvent(event) {
  const senderId = event.sender?.id;
  const recipientId = event.recipient?.id;
  const message = event.message;
  
  console.log('[Webhook] New message received:');
  console.log(`  From: ${senderId}`);
  console.log(`  To: ${recipientId}`);
  console.log(`  Message: ${message?.text || '[media]'}`);
  
  // TODO: Implement your message handling logic here
  // Example: Auto-respond to FAQs
  // Example: Route to customer support
  // Example: Trigger chatbot flow
  
  if (global.eventEmitter) {
    global.eventEmitter.emit('instagram:message', {
      senderId,
      recipientId,
      message,
      timestamp: new Date()
    });
  }
}

/**
 * Handle postback events (button clicks, quick replies)
 */
function handlePostbackEvent(event) {
  const senderId = event.sender?.id;
  const postback = event.postback;
  
  console.log('[Webhook] Postback received:');
  console.log(`  From: ${senderId}`);
  console.log(`  Payload: ${postback?.payload}`);
  
  // TODO: Handle button clicks and quick reply responses
  
  if (global.eventEmitter) {
    global.eventEmitter.emit('instagram:postback', {
      senderId,
      payload: postback?.payload,
      timestamp: new Date()
    });
  }
}

/**
 * Handle mention events (when someone @mentions your account)
 */
function handleMentionEvent(value) {
  const mediaId = value.media_id;
  const commentId = value.comment_id;
  
  console.log('[Webhook] Mention received:');
  console.log(`  Media ID: ${mediaId}`);
  console.log(`  Comment ID: ${commentId}`);
  
  // TODO: Handle mentions in Stories or posts
  
  if (global.eventEmitter) {
    global.eventEmitter.emit('instagram:mention', {
      mediaId,
      commentId,
      timestamp: new Date()
    });
  }
}

module.exports = router;
