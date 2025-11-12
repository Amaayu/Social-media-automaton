const express = require('express');
const router = express.Router();
const AIPostController = require('../controllers/ai-post.controller');

const aiPostController = new AIPostController();

/**
 * POST /api/ai-post/generate
 * Generate and optionally publish AI post
 */
router.post('/generate', (req, res) => {
  aiPostController.generateAndPublishPost(req, res);
});

/**
 * GET /api/ai-post/status
 * Check if post generation is in progress
 */
router.get('/status', (req, res) => {
  aiPostController.getGenerationStatus(req, res);
});

/**
 * GET /api/ai-post/history
 * Get user's generated posts history
 */
router.get('/history', (req, res) => {
  aiPostController.getGeneratedPosts(req, res);
});

/**
 * GET /api/ai-post/limit
 * Check Instagram publishing rate limit
 */
router.get('/limit', (req, res) => {
  aiPostController.checkPublishingLimit(req, res);
});

/**
 * POST /api/ai-post/context
 * Save user account context for personalized generation
 */
router.post('/context', (req, res) => {
  aiPostController.saveUserContext(req, res);
});

/**
 * GET /api/ai-post/context
 * Get user's saved account context
 */
router.get('/context', (req, res) => {
  aiPostController.getUserContext(req, res);
});

/**
 * DELETE /api/ai-post/posts/:postId
 * Delete a specific post
 */
router.delete('/posts/:postId', (req, res) => {
  aiPostController.deletePost(req, res);
});

module.exports = router;
