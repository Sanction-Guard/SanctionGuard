import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { connectDBLocal, localMongoose } from '../../src/config/db.js';

// Mock mongoose
jest.mock('mongoose', () => {
  const mMongooseInstance = {
    connect: jest.fn()
  };
  
  return {
    Mongoose: jest.fn().mockImplementation(() => mMongooseInstance)
  };
});

// Mock console methods
global.console = {
  log: jest.fn(),
  error: jest.fn()
};

describe('Local Database Connection Tests', () => {
  // Save original env and restore after tests
  const originalEnv = process.env;
  
  beforeEach(() => {
    // Reset mocks and env before each test
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.MONGODB_URI_local = 'mongodb://test-local-uri';
  });
  
  afterAll(() => {
    process.env = originalEnv;
  });
  
  test('should connect to local MongoDB successfully', async () => {
    // Setup
    const mockMongooseInstance = mongoose.Mongoose();
    mockMongooseInstance.connect.mockResolvedValueOnce();
    
    // Act
    await connectDBLocal();
    
    // Assert
    expect(mockMongooseInstance.connect).toHaveBeenCalledWith('mongodb://test-local-uri');
    expect(console.log).toHaveBeenCalledWith('✅ Local MongoDB Connected Successfully');
    expect(console.error).not.toHaveBeenCalled();
  });
  
  test('should handle connection errors', async () => {
    // Setup
    const mockError = new Error('Connection failed');
    const mockMongooseInstance = mongoose.Mongoose();
    mockMongooseInstance.connect.mockRejectedValueOnce(mockError);
    
    // Act
    await connectDBLocal();
    
    // Assert
    expect(mockMongooseInstance.connect).toHaveBeenCalledWith('mongodb://test-local-uri');
    expect(console.error).toHaveBeenCalledWith('❌ Local MongoDB Connection Error:', 'Connection failed');
    expect(console.log).not.toHaveBeenCalled();
  });
  
  test('should export localMongoose instance', () => {
    // Assert
    expect(localMongoose).toBeDefined();
  });
});