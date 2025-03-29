import { jest } from '@jest/globals';
import express from 'express';
import cors from 'cors';

// Mock all dependencies consistently
jest.unstable_mockModule('express', () => ({
  default: jest.fn(() => ({
    use: jest.fn(),
    listen: jest.fn((port, callback) => {
      callback();
      return { close: jest.fn() };
    }),
    json: jest.fn(() => 'json-middleware')
  }))
}));

jest.unstable_mockModule('cors', () => ({
  default: jest.fn(() => 'cors-middleware')
}));

jest.unstable_mockModule('./src/config/db.js', () => ({
  connectDBLocal: jest.fn(() => Promise.resolve())
}));

jest.unstable_mockModule('./src/config/dataB.js', () => ({
  connectDBuser: jest.fn(() => Promise.resolve())
}));

jest.unstable_mockModule('./src/config/userDB.js', () => ({
  userDB: {
    readyState: 1,
    once: jest.fn((event, callback) => callback())
  }
}));

jest.unstable_mockModule('./src/services/schedulerServices.js', () => ({
  startScheduler: jest.fn(() => Promise.resolve())
}));

jest.unstable_mockModule('./src/utils/logger.js', () => ({
  logger: {
    error: jest.fn(),
    info: jest.fn()
  }
}));

jest.unstable_mockModule('./src/utils/dbConnections.js', () => ({
  connections: {
    local: { isConnected: jest.fn(() => true), readyState: 1 },
    un: { isConnected: jest.fn(() => true), readyState: 1 }
  },
  initializeConnections: jest.fn(() => Promise.resolve())
}));

// Import the server after all mocks are set up
const { default: server } = await import('./server.js');

describe('Server Initialization', () => {
  let app;

  beforeEach(async () => {
    jest.clearAllMocks();
    app = await server();
  });

  afterEach(() => {
    if (app?.close) {
      app.close();
    }
  });

  test('should set up express app with middleware', async () => {
    expect(express().use).toHaveBeenCalledWith('json-middleware');
    expect(express().use).toHaveBeenCalledWith('cors-middleware');
    expect(cors).toHaveBeenCalled();
  });

  // ... rest of your tests
});