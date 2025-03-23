import { jest } from '@jest/globals';
import { authorize } from '../../src/middlewares/authorize'

describe('Authorization Middleware', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;

  beforeEach(() => {
    mockRequest = {
      user: {
        role: 'user'
      }
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  test('should allow access for authorized role', () => {
    // Setup
    const middleware = authorize(['user', 'admin']);

    // Act
    middleware(mockRequest, mockResponse, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  test('should deny access for unauthorized role', () => {
    // Setup
    const middleware = authorize(['admin']);

    // Act
    middleware(mockRequest, mockResponse, mockNext);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Access denied'
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  test('should handle multiple roles', () => {
    // Setup
    mockRequest.user.role = 'editor';
    const middleware = authorize(['editor', 'admin']);

    // Act
    middleware(mockRequest, mockResponse, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalled();
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  test('should handle empty roles array', () => {
    // Setup
    const middleware = authorize([]);

    // Act
    middleware(mockRequest, mockResponse, mockNext);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Access denied'
    });
  });
});