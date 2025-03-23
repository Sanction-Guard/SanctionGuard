import { jest } from '@jest/globals';
import express from 'express';
import searchController from '../../src/controllers/searchController.js';
import routesModule from '../../src/routes/auditRoutes.js';

// Mock dependencies
jest.mock('express', () => {
  const mockRouter = {
    get: jest.fn()
  };
  return {
    Router: jest.fn(() => mockRouter)
  };
});

jest.mock('../../src/controllers/searchController.js', () => ({
  getAuditLogs: 'getAuditLogsFunction'
}));

describe('Audit Routes', () => {
  let router;
  
  beforeEach(() => {
    jest.clearAllMocks();
    router = express.Router();
  });
  
  test('should set up GET audit-logs route', () => {
    // Assert
    expect(router.get).toHaveBeenCalledWith(
      '/audit-logs', 
      'getAuditLogsFunction'
    );
  });
  
  test('should export router', () => {
    // Assert
    expect(routesModule).toBe(router);
  });
});