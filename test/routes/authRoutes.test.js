import { jest } from '@jest/globals';
import express from 'express';
import { loginUser } from '../../src/controllers/authController.js';
import routesModule from '../../src/routes/authRoutes.js';

// Mock dependencies
jest.mock('express', () => {
  const mockRouter = {
    post: jest.fn()
  };
  return {
    Router: jest.fn(() => mockRouter)
  };
});

jest.mock('../../src/controllers/authController.js', () => ({
  loginUser: 'loginUserFunction'
}));

describe('Auth Routes', () => {
  let router;
  
  beforeEach(() => {
    jest.clearAllMocks();
    router = express.Router();
  });
  
  test('should set up POST login route', () => {
    // Assert
    expect(router.post).toHaveBeenCalledWith(
      '/login', 
      'loginUserFunction'
    );
  });
  
  test('should export router', () => {
    // Assert
    expect(routesModule).toBe(router);
  });
});