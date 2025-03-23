import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { authenticate } from '../../src/middlewares/authenticate.js';
import { User } from '../../src/config/userDB.js';

// Mock dependencies
jest.mock('jsonwebtoken');
jest.mock('../../src/config/userDB.js');

describe('Authentication Middleware', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      header: jest.fn()
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  test('should authenticate valid token', async () => {
    // Setup
    const mockUser = { id: 'user123', name: 'Test User' };
    mockRequest.header.mockReturnValue('Bearer valid-token');
    jwt.verify.mockReturnValue({ id: 'user123' });
    User.findById.mockResolvedValue(mockUser);

    // Act
    await authenticate(mockRequest, mockResponse, mockNext);

    // Assert
    expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
    expect(User.findById).toHaveBeenCalledWith('user123');
    expect(mockRequest.user).toBe(mockUser);
    expect(mockNext).toHaveBeenCalled();
  });

  test('should reject request without token', async () => {
    // Setup
    mockRequest.header.mockReturnValue(null);

    // Act
    await authenticate(mockRequest, mockResponse, mockNext);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'No token, authorization denied'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should handle invalid token', async () => {
    // Setup
    mockRequest.header.mockReturnValue('Bearer invalid-token');
    jwt.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    // Act
    await authenticate(mockRequest, mockResponse, mockNext);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Token is not valid'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should handle user not found', async () => {
    // Setup
    mockRequest.header.mockReturnValue('Bearer valid-token');
    jwt.verify.mockReturnValue({ id: 'nonexistent-user' });
    User.findById.mockResolvedValue(null);

    // Act
    await authenticate(mockRequest, mockResponse, mockNext);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Token is not valid'
    });
  });
});