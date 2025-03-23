// import { jest } from '@jest/globals';
// import express from 'express';
// import searchController from '../../src/controllers/searchController.js';
// import auditLogMiddleware from '../../src/middlewares/auditLog.js';
// import routesModule from '../../src/routes/searchRoutes.js';

// // Mock dependencies
// jest.mock('express', () => {
//   const mockRouter = {
//     post: jest.fn(),
//     get: jest.fn()
//   };
//   return {
//     Router: jest.fn(() => mockRouter)
//   };
// });

// jest.mock('../../src/controllers/searchController.js', () => ({
//   search: 'searchControllerFunction',
//   getDatabaseStatus: 'getStatusFunction'
// }));

// jest.mock('../../src/middlewares/auditLog.js', () => 'auditLogMiddleware');

// describe('Search Routes', () => {
//   let router;
  
//   beforeEach(() => {
//     jest.clearAllMocks();
//     router = express.Router();
//   });
  
//   test('should set up search route with audit middleware', () => {
//     // Act - just importing the module is enough as it configures the routes
    
//     // Assert
//     expect(router.post).toHaveBeenCalledWith(
//       '/search', 
//       'auditLogMiddleware', 
//       'searchControllerFunction'
//     );
//   });
  
//   test('should set up status route', () => {
//     // Act - just importing the module is enough as it configures the routes
    
//     // Assert
//     expect(router.get).toHaveBeenCalledWith(
//       '/status', 
//       'getStatusFunction'
//     );
//   });
  
//   test('should export router', () => {
//     // Assert
//     expect(routesModule).toBe(router);
//   });
// });

import { jest } from '@jest/globals';
import express from 'express';
import searchController from '../../src/controllers/searchController.js';
import auditLogMiddleware from '../../src/middlewares/auditLog.js';

// Mock dependencies before importing the module under test
jest.mock('express', () => {
  const mockRouter = {
    post: jest.fn(),
    get: jest.fn()
  };
  return {
    Router: jest.fn(() => mockRouter)
  };
});

jest.mock('../../src/controllers/searchController.js', () => ({
  search: 'searchControllerFunction',
  getDatabaseStatus: 'getStatusFunction'
}));

jest.mock('../../src/middlewares/auditLog.js', () => 'auditLogMiddleware');

// Import the module under test AFTER setting up all mocks
import routesModule from '../../src/routes/searchRoutes.js';

describe('Search Routes', () => {
  let router;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Get the mock router that was returned by express.Router()
    router = express.Router();
  });
  
  test('should set up search route with audit middleware', () => {
    // Import triggers the route setup
    
    // Assert
    expect(router.post).toHaveBeenCalledWith(
      '/search', 
      'auditLogMiddleware', 
      'searchControllerFunction'
    );
  });
  
  test('should set up status route', () => {
    // Import triggers the route setup
    
    // Assert
    expect(router.get).toHaveBeenCalledWith(
      '/status', 
      'getStatusFunction'
    );
  });
  
  test('should export router', () => {
    // Assert the module exports what we expect
    expect(routesModule).toBe(router);
  });
});