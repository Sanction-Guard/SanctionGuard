import express from 'express'; // 👈 Use import
import searchController from '../controllers/searchController.js'; // 👈 Use import
import auditLogMiddleware from '../middlewares/auditLog.js'; // 👈 Use import

const router = express.Router();

router.post('/search', auditLogMiddleware, searchController.search);
router.get('/status', searchController.getDatabaseStatus);

export default router; // 👈 Use export