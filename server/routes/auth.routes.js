const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middleware/auth.middleware');

/**
 * Authentication Routes
 */

// Public routes
router.post('/register', authController.register.bind(authController));
router.post('/login', authController.login.bind(authController));

// Protected routes
router.use(authMiddleware); // All routes below require authentication

router.post('/logout', authController.logout.bind(authController));
router.get('/me', authController.getProfile.bind(authController));
router.put('/profile', authController.updateProfile.bind(authController));
router.put('/password', authController.changePassword.bind(authController));

module.exports = router;
