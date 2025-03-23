import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { connectDBuser } from '../../src/config/dataB.js'; // Ensure this is an ES module export

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

describe('User Database Connection Tests', () => {
  // Save original env and restore after tests
  const originalEnv = process.env;
  
  beforeEach(() => {
    // Reset mocks and env before each test
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.MONGODB_URI = 'mongodb://test-user-uri';
  });
  
  afterAll(() => {
    process.env = originalEnv;
  });
  
  test('should connect to user MongoDB successfully', async () => {
    // Setup
    const mockMongooseInstance = mongoose.Mongoose();
    mockMongooseInstance.connect.mockResolvedValueOnce();
    
    // Act
    await connectDBuser();
    
    // Assert
    expect(mockMongooseInstance.connect).toHaveBeenCalledWith('mongodb://test-user-uri');
    expect(console.log).toHaveBeenCalledWith('✅ user MongoDB Connected Successfully');
    expect(console.error).not.toHaveBeenCalled();
  });
  
  test('should handle connection errors', async () => {
    // Setup
    const mockError = new Error('Connection failed');
    const mockMongooseInstance = mongoose.Mongoose();
    mockMongooseInstance.connect.mockRejectedValueOnce(mockError);
    
    // Act
    await connectDBuser();
    
    // Assert
    expect(mockMongooseInstance.connect).toHaveBeenCalledWith('mongodb://test-user-uri');
    expect(console.error).toHaveBeenCalledWith('❌ User MongoDB Connection Error:', 'Connection failed');
    expect(console.log).not.toHaveBeenCalled();
  });
});