import express from 'express';
import { authenticate } from '../middlewares/authenticate.js';
import { authorize } from '../middlewares/authorize.js'; 
import searchController from '../controllers/searchController.js'; 
import auditLogMiddleware from '../middlewares/auditLog.js'; 

const router = express.Router();

// Protect the /search route with authentication and role-based authorization
router.post(
    '/search',
    authenticate, // Verify the user is logged in
    authorize(['operator', 'manager', 'admin']), // Allow only operator, manager, and admin
    auditLogMiddleware, // Log the activity
    searchController.search // Handle the search logic
  );
  
router.get('/status', searchController.getDatabaseStatus);

export default router; 