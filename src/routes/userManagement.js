import express from 'express';
import { 
  getUsers, 
  getUserById, 
  createUser, 
  updateUser, 
  deleteUser, 
  getUserProfile,
  changePassword
} from '../controllers/userController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticate, authorize(['Admin']), getUsers);

// Get user by ID (Admin only)
router.get('/:id', authenticate, authorize(['Admin']), getUserById);

// Create new user (Admin only)
router.post('/', authenticate, authorize(['Admin']), createUser);

// Update user (Admin only)
router.put('/:id', authenticate, authorize(['Admin']), updateUser);

// Delete user (Admin only)
router.delete('/:id', authenticate, authorize(['Admin']), deleteUser);

// Get current user profile
router.get('/profile/me', authenticate, getUserProfile);

// Change password
router.put('/password/change', authenticate, changePassword);

export default router;