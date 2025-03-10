import express from 'express';
import { 
  getSystemLogs, 
  exportLogs 
} from '../controllers/logsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get system logs (Admin and Analyst)
router.get('/', authenticate, authorize(['Admin', 'Analyst']), getSystemLogs);

// Export logs (Admin and Analyst)
router.get('/export', authenticate, authorize(['Admin', 'Analyst']), exportLogs);

export default router;