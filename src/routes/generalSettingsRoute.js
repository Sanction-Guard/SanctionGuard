import express from 'express';
import { getGeneralSettings, updateGeneralSettings } from '../controllers/generalSettingsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get general settings
router.get('/', authenticate, getGeneralSettings);

// Update general settings (Admin only)
router.put('/', authenticate, authorize(['Admin']), updateGeneralSettings);

export default router;