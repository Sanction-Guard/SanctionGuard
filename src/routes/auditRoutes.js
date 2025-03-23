import express from 'express';
import searchController from '../controllers/searchController.js';
const router = express.Router();
router.get('/audit-logs', searchController.getAuditLogs);

export default router;
