import { jest } from '@jest/globals';
import express from 'express';
import { 
  getDataSource, 
  setDataSource, 
  getData 
} from '../../src/controllers/dataSourceController.js';
import routesModule from '../../src/routes/dataSourceRoutes.js';

// Mock dependencies
jest.mock('express', () => {
  const mockRouter = {
    get: jest.fn(),
    post: jest.fn()
  };
  return {
    Router: jest.fn(() => mockRouter)
  };
});

jest.mock('../../src/controllers/dataSourceController.js', () => ({
  getDataSource: 'getDataSourceFunction',
  setDataSource: 'setDataSourceFunction',
  getData: 'getDataFunction'
}));

describe('Data Source Routes', () => {
  let router;
  
  beforeEach(() => {
    jest.clearAllMocks();
    router = express.Router();
  });
  
  test('should set up GET data-source route', () => {
    // Assert
    expect(router.get).toHaveBeenCalledWith(
      '/data-source', 
      'getDataSourceFunction'
    );
  });
  
  test('should set up POST data-source route', () => {
    // Assert
    expect(router.post).toHaveBeenCalledWith(
      '/data-source', 
      'setDataSourceFunction'
    );
  });
  
  test('should set up GET data route', () => {
    // Assert
    expect(router.get).toHaveBeenCalledWith(
      '/data', 
      'getDataFunction'
    );
  });
  
  test('should export router', () => {
    // Assert
    expect(routesModule).toBe(router);
  });
});