import express from 'express';
import searchController from '../controllers/searchController.js';
import auditLogMiddleware from '../middlewares/auditLog.js';

const router = express.Router();

router.post('/search', auditLogMiddleware, searchController.search);
router.get('/status', searchController.getDatabaseStatus);

export default router;