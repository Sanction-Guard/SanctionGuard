// Import Jest globals first
import { jest } from '@jest/globals';

// Set up mocks before any imports of the modules we want to mock
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

// Import modules after setting up mocks
import express from 'express';
import { loginUser } from '../../src/controllers/authController.js';
import routesModule from '../../src/routes/authRoutes.js';

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