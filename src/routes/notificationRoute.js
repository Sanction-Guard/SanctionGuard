import express from 'express';
import { 
  getNotificationSettings, 
  updateNotificationSettings 
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get notification settings for current user
router.get('/', authenticate, getNotificationSettings);

// Update notification settings for current user
router.put('/', authenticate, updateNotificationSettings);

export default router;