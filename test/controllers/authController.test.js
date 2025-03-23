import { jest } from '@jest/globals';
import { loginUser } from '../../src/controllers/authController.js';
import { login } from '../../src/services/authService.js';

// Mock dependencies
jest.mock('../../src/services/authService.js');

describe('Auth Controller', () => {
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      body: {
        email: 'test@example.com',
        password: 'password123'
      }
    };
    
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  test('should login user successfully', async () => {
    // Setup
    const mockToken = 'mock-jwt-token';
    login.mockResolvedValueOnce(mockToken);

    // Act
    await loginUser(mockRequest, mockResponse);

    // Assert
    expect(login).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      token: mockToken,
      message: 'Login successful'
    });
  });

  test('should handle login failure', async () => {
    // Setup
    const error = new Error('Invalid credentials');
    login.mockRejectedValueOnce(error);

    // Act
    await loginUser(mockRequest, mockResponse);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid credentials'
    });
  });
});