import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import searchController from '../../src/controllers/searchController.js';
import searchService from '../../src/services/searchService.js';
import AuditLog from '../../src/models/AuditLog.js';

// Mock dependencies
jest.mock('../../src/services/searchService.js');
jest.mock('../../src/models/AuditLog.js');

describe('Search Controller', () => {
  let mockRequest;
  let mockResponse;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      body: {
        searchTerm: 'test',
        searchType: 'individual'
      },
      user: {
        userId: 'testUserId'
      },
      auditLog: null
    };
    
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  describe('search', () => {
    test('should perform search and create audit log', async () => {
      // Setup
      const mockResults = ['result1', 'result2'];
      searchService.performSearch.mockResolvedValueOnce(mockResults);
      AuditLog.prototype.save = jest.fn();

      // Act
      await searchController.search(mockRequest, mockResponse);

      // Assert
      expect(searchService.performSearch).toHaveBeenCalledWith('test', 'individual');
      expect(AuditLog).toHaveBeenCalledWith({
        userId: 'testUserId',
        action: 'Search',
        searchTerm: 'test',
        searchType: 'individual',
        results: mockResults
      });
      expect(mockResponse.json).toHaveBeenCalledWith(mockResults);
    });

    test('should handle errors', async () => {
      // Setup
      const error = new Error('Search failed');
      searchService.performSearch.mockRejectedValueOnce(error);

      // Act
      await searchController.search(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Search failed'
      });
    });
  });

  describe('getDatabaseStatus', () => {
    test('should return database status', async () => {
      // Setup
      const mockStatus = { status: 'connected' };
      searchService.getDatabaseStatus.mockResolvedValueOnce(mockStatus);

      // Act
      await searchController.getDatabaseStatus(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(mockStatus);
    });

    test('should handle errors', async () => {
      // Setup
      const error = new Error('Status check failed');
      searchService.getDatabaseStatus.mockRejectedValueOnce(error);

      // Act
      await searchController.getDatabaseStatus(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Status check failed'
      });
    });
  });

  describe('getAuditLogs', () => {
    test('should return filtered audit logs', async () => {
      // Setup
      const mockLogs = [{ id: 1 }, { id: 2 }];
      mockRequest.query = {
        userId: 'user1',
        searchTerm: 'test',
        searchType: 'individual',
        action: 'Search'
      };
      AuditLog.find = jest.fn().mockReturnThis();
      AuditLog.sort = jest.fn().mockResolvedValueOnce(mockLogs);

      // Act
      await searchController.getAuditLogs(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith(mockLogs);
    });

    test('should handle errors', async () => {
      // Setup
      const error = new Error('Failed to fetch logs');
      AuditLog.find = jest.fn().mockRejectedValueOnce(error);

      // Act
      await searchController.getAuditLogs(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Failed to fetch logs'
      });
    });
  });
});