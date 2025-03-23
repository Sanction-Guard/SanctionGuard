import { jest } from '@jest/globals';
import { userMongoose } from '../../src/config/dataB.js';
import AuditLog from '../../src/middlewares/auditLog.js';

// Mock dependencies
jest.mock('../config/dataB.js', () => ({
  userMongoose: {
    Schema: jest.fn(() => ({
      pre: jest.fn(),
    })),
    model: jest.fn(),
    Schema: {
      Types: {
        ObjectId: 'ObjectId'
      }
    }
  }
}));

describe('AuditLog Model', () => {
  test('should create schema with correct fields', () => {
    // Assert
    expect(userMongoose.Schema).toHaveBeenCalledWith({
      userId: { type: 'ObjectId', ref: 'User' },
      action: { type: String, required: true },
      searchTerm: { type: String, required: true },
      searchType: { type: String, required: true },
      results: { type: Array, required: true },
      timestamp: { type: Date, default: Date.now }
    }, { collection: 'systemlogs' });
  });

  test('should create model with correct name', () => {
    // Assert
    expect(userMongoose.model).toHaveBeenCalledWith('AuditLog', expect.any(Object));
  });
});