// import { jest } from '@jest/globals';
// import express from 'express';
// import cors from 'cors';
// import { connectDBLocal } from './src/config/db.js';
// import { connectDBuser } from './src/config/dataB.js';
// import { startScheduler } from './src/services/schedulerServices.js';
// import { logger } from './src/utils/logger.js';
// import { initializeConnections, connections } from './src/utils/dbConnections.js';
// import searchRoutes from './src/routes/searchRoutes.js';
// import auditRoutes from './src/routes/auditRoutes.js';
// import authRoutes from './src/routes/authRoutes.js';
// import dataSourceRoutes from './src/routes/dataSourceRoutes.js';
// import { userDB } from './src/config/userDB.js';

// // Mock all the dependencies
// jest.mock('express', () => {
//   const expressMock = jest.fn(() => expressMock);
//   expressMock.json = jest.fn(() => 'json-middleware');
//   expressMock.use = jest.fn();
//   expressMock.listen = jest.fn((port, callback) => {
//     callback();
//     return { close: jest.fn() };
//   });
//   return expressMock;
// });

// jest.mock('cors', () => jest.fn(() => 'cors-middleware'));
// jest.mock('../src/config/db.js');
// jest.mock('../src/config/dataB.js');
// jest.mock('../src/config/userDB.js', () => ({
//   userDB: {
//     readyState: 0,
//     once: jest.fn((event, callback) => callback())
//   }
// }));
// jest.mock('../src/services/schedulerServices.js');
// jest.mock('../src/utils/logger.js');
// jest.mock('../src/utils/dbConnections.js', () => ({
//   connections: {
//     local: { isConnected: jest.fn(() => true), readyState: 1 },
//     un: { isConnected: jest.fn(() => true), readyState: 1 }
//   },
//   initializeConnections: jest.fn()
// }));
// jest.mock('../src/routes/searchRoutes.js', () => 'searchRoutes');
// jest.mock('../src/routes/auditRoutes.js', () => 'auditRoutes');
// jest.mock('../src/routes/authRoutes.js', () => 'authRoutes');
// jest.mock('../src/routes/dataSourceRoutes.js', () => 'dataSourceRoutes');

// // Mock dynamic import
// jest.mock('../src/routes/pdfRoute.js', () => ({ default: 'pdfRoute' }), { virtual: true });
// global.console = { log: jest.fn(), error: jest.fn() };

// // Backup and restore process.exit
// const originalProcessExit = process.exit;
// beforeAll(() => {
//   process.exit = jest.fn();
// });
// afterAll(() => {
//   process.exit = originalProcessExit;
// });

// describe('Server Initialization', () => {
//   let main;
  
//   beforeEach(async () => {
//     jest.clearAllMocks();
//     // Need to re-import to reset the module state
//     const serverModule = await import('./server.js');
//     main = serverModule.main;
//   });
  
//   test('should set up express app with middleware', async () => {
//     // Act
//     await main();
    
//     // Assert
//     expect(express).toHaveBeenCalled();
//     expect(express().use).toHaveBeenCalledWith('json-middleware');
//     expect(express().use).toHaveBeenCalledWith('cors-middleware');
//     expect(cors).toHaveBeenCalled();
//   });
  
//   test('should connect to all required databases', async () => {
//     // Act
//     await main();
    
//     // Assert
//     expect(connectDBLocal).toHaveBeenCalled();
//     expect(connectDBuser).toHaveBeenCalled();
//     expect(initializeConnections).toHaveBeenCalled();
//     expect(userDB.once).toHaveBeenCalledWith('open', expect.any(Function));
//   });
  
//   test('should start the scheduler', async () => {
//     // Act
//     await main();
    
//     // Assert
//     expect(startScheduler).toHaveBeenCalled();
//   });
  
//   test('should set up routes', async () => {
//     // Act
//     await main();
    
//     // Assert
//     expect(express().use).toHaveBeenCalledWith('/api/search', 'searchRoutes');
//     expect(express().use).toHaveBeenCalledWith('/api', 'auditRoutes');
//     expect(express().use).toHaveBeenCalledWith('/api/settings', 'dataSourceRoutes');
//     expect(express().use).toHaveBeenCalledWith('/api/auth', 'authRoutes');
//     expect(express().use).toHaveBeenCalledWith('/api/pdf', 'pdfRoute');
//   });
  
//   test('should start the Express server', async () => {
//     // Setup
//     process.env.PORT = '4000';
    
//     // Act
//     await main();
    
//     // Assert
//     expect(express().listen).toHaveBeenCalledWith('4000', expect.any(Function));
//     expect(console.log).toHaveBeenCalledWith('🚀 Server running on http://localhost:4000');
    
//     // Cleanup
//     delete process.env.PORT;
//   });
  
//   test('should exit process on error', async () => {
//     // Setup
//     connectDBLocal.mockRejectedValueOnce(new Error('DB connection error'));
    
//     // Act
//     await main();
    
//     // Assert
//     expect(logger.error).toHaveBeenCalledWith('Application error:', expect.any(Error));
//     expect(process.exit).toHaveBeenCalledWith(1);
//   });

//   test('should throw error if database connections fail', async () => {
//     // Setup
//     connections.local.isConnected.mockReturnValueOnce(false);
    
//     // Act
//     await main();
    
//     // Assert
//     expect(logger.error).toHaveBeenCalledWith(
//       'Application error:', 
//       expect.objectContaining({
//         message: 'Failed to connect to LocalSanction or UNSanction databases'
//       })
//     );
//     expect(process.exit).toHaveBeenCalledWith(1);
//   });
// });

import { jest } from '@jest/globals';
import express from 'express';
import cors from 'cors';
import { connectDBLocal } from './src/config/db.js';
import { connectDBuser } from './src/config/dataB.js';
import { startScheduler } from './src/services/schedulerServices.js';
import { logger } from './src/utils/logger.js';
import { initializeConnections, connections } from './src/utils/dbConnections.js';
import searchRoutes from './src/routes/searchRoutes.js';
import auditRoutes from './src/routes/auditRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import dataSourceRoutes from './src/routes/dataSourceRoutes.js';
import { userDB } from './src/config/userDB.js';

// Mock all the dependencies
jest.mock('express', () => {
  const expressMock = jest.fn(() => expressMock);
  expressMock.json = jest.fn(() => 'json-middleware');
  expressMock.use = jest.fn();
  expressMock.listen = jest.fn((port, callback) => {
    callback();
    return { close: jest.fn() };
  });
  return expressMock;
});

jest.mock('cors', () => jest.fn(() => 'cors-middleware'));
jest.mock('./src/config/db.js', () => ({
  connectDBLocal: jest.fn()
}));
jest.mock('./src/config/dataB.js', () => ({
  connectDBuser: jest.fn()
}));
jest.mock('./src/config/userDB.js', () => ({
  userDB: {
    readyState: 0,
    once: jest.fn((event, callback) => callback())
  }
}));
jest.mock('./src/services/schedulerServices.js', () => ({
  startScheduler: jest.fn()
}));
jest.mock('./src/utils/logger.js', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn()
  }
}));
jest.mock('./src/utils/dbConnections.js', () => ({
  connections: {
    local: { isConnected: jest.fn(() => true), readyState: 1 },
    un: { isConnected: jest.fn(() => true), readyState: 1 }
  },
  initializeConnections: jest.fn()
}));
jest.mock('./src/routes/searchRoutes.js', () => 'searchRoutes');
jest.mock('./src/routes/auditRoutes.js', () => 'auditRoutes');
jest.mock('./src/routes/authRoutes.js', () => 'authRoutes');
jest.mock('./src/routes/dataSourceRoutes.js', () => 'dataSourceRoutes');

// Mock dynamic import
jest.mock('./src/routes/pdfRoute.js', () => ({ default: 'pdfRoute' }), { virtual: true });
global.console = { log: jest.fn(), error: jest.fn() };

// Backup and restore process.exit
const originalProcessExit = process.exit;
beforeAll(() => {
  process.exit = jest.fn();
});
afterAll(() => {
  process.exit = originalProcessExit;
});

describe('Server Initialization', () => {
  let main;
  
  beforeEach(async () => {
    jest.clearAllMocks();
    // Need to re-import to reset the module state
    const serverModule = await import('./server.js');
    main = serverModule.main;
  });
  
  test('should set up express app with middleware', async () => {
    // Act
    await main();
    
    // Assert
    expect(express).toHaveBeenCalled();
    expect(express().use).toHaveBeenCalledWith('json-middleware');
    expect(express().use).toHaveBeenCalledWith('cors-middleware');
    expect(cors).toHaveBeenCalled();
  });
  
  test('should connect to all required databases', async () => {
    // Act
    await main();
    
    // Assert
    expect(connectDBLocal).toHaveBeenCalled();
    expect(connectDBuser).toHaveBeenCalled();
    expect(initializeConnections).toHaveBeenCalled();
    expect(userDB.once).toHaveBeenCalledWith('open', expect.any(Function));
  });
  
  test('should start the scheduler', async () => {
    // Act
    await main();
    
    // Assert
    expect(startScheduler).toHaveBeenCalled();
  });
  
  test('should set up routes', async () => {
    // Act
    await main();
    
    // Assert
    expect(express().use).toHaveBeenCalledWith('/api/search', 'searchRoutes');
    expect(express().use).toHaveBeenCalledWith('/api', 'auditRoutes');
    expect(express().use).toHaveBeenCalledWith('/api/settings', 'dataSourceRoutes');
    expect(express().use).toHaveBeenCalledWith('/api/auth', 'authRoutes');
    expect(express().use).toHaveBeenCalledWith('/api/pdf', 'pdfRoute');
  });
  
  test('should start the Express server', async () => {
    // Setup
    process.env.PORT = '4000';
    
    // Act
    await main();
    
    // Assert
    expect(express().listen).toHaveBeenCalledWith('4000', expect.any(Function));
    expect(console.log).toHaveBeenCalledWith('🚀 Server running on http://localhost:4000');
    
    // Cleanup
    delete process.env.PORT;
  });
  
  test('should exit process on error', async () => {
    // Setup
    connectDBLocal.mockRejectedValueOnce(new Error('DB connection error'));
    
    // Act
    await main();
    
    // Assert
    expect(logger.error).toHaveBeenCalledWith('Application error:', expect.any(Error));
    expect(process.exit).toHaveBeenCalledWith(1);
  });

  test('should throw error if database connections fail', async () => {
    // Setup
    connections.local.isConnected.mockReturnValueOnce(false);
    
    // Act
    await main();
    
    // Assert
    expect(logger.error).toHaveBeenCalledWith(
      'Application error:', 
      expect.objectContaining({
        message: 'Failed to connect to LocalSanction or UNSanction databases'
      })
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});