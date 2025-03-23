import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import auditLogMiddleware from '../../src/middlewares/auditLog.js';
import AuditLog from '../../src/models/AuditLog.js';

// Mock dependencies
jest.mock('../../src/models/AuditLog.js');
jest.mock(mongoose);

describe('Audit Log Middleware', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      user: {
        userId: 'user123'
      },
      body: {
        searchTerm: 'test',
        searchType: 'individual'
      },
      originalUrl: '/api/search'
    };
    mockResponse = {};
    mockNext = jest.fn();

    // Mock AuditLog constructor and save method
    AuditLog.mockImplementation(() => ({
      save: jest.fn().mockResolvedValue({})
    }));
  });

  test('should create audit log entry', async () => {
    // Act
    await auditLogMiddleware(mockRequest, mockResponse, mockNext);

    // Assert
    expect(AuditLog).toHaveBeenCalledWith({
      userId: 'user123',
      action: 'search',
      searchTerm: 'test',
      searchType: 'individual',
      results: []
    });
    expect(mockRequest.auditLog).toBeDefined();
    expect(mockNext).toHaveBeenCalled();
  });

  test('should handle missing user ID', async () => {
    // Setup
    mockRequest.user = null;
    mongoose.Types.ObjectId = jest.fn().mockReturnValue('generated-id');

    // Act
    await auditLogMiddleware(mockRequest, mockResponse, mockNext);

    // Assert
    expect(AuditLog).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'generated-id'
    }));
    expect(mockNext).toHaveBeenCalled();
  });

  test('should handle save errors', async () => {
    // Setup
    const error = new Error('Database error');
    AuditLog.mockImplementation(() => ({
      save: jest.fn().mockRejectedValue(error)
    }));

    // Act
    await auditLogMiddleware(mockRequest, mockResponse, mockNext);

    // Assert
    expect(mockNext).toHaveBeenCalledWith(error);
  });

  test('should extract action from URL correctly', async () => {
    // Setup
    mockRequest.originalUrl = '/api/complex/path/action';

    // Act
    await auditLogMiddleware(mockRequest, mockResponse, mockNext);

    // Assert
    expect(AuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'action'
    }));
  });
});