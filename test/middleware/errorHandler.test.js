import { jest } from '@jest/globals';
import errorHandler from '../../src/middlewares/errorHandler';

describe('Error Handler Middleware', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  test('should handle error with message', () => {
    // Setup
    const error = new Error('Test error message');

    // Act
    errorHandler(error, mockRequest, mockResponse, mockNext);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Test error message'
    });
  });

  test('should handle error without message', () => {
    // Setup
    const error = new Error();

    // Act
    errorHandler(error, mockRequest, mockResponse, mockNext);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Internal Server Error'
    });
  });

  test('should handle non-Error objects', () => {
    // Setup
    const error = { custom: 'error' };

    // Act
    errorHandler(error, mockRequest, mockResponse, mockNext);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Internal Server Error'
    });
  });
});