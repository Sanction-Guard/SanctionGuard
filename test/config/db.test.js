import { jest } from '@jest/globals';

// Properly mock mongoose
jest.mock('mongoose', () => ({
  Mongoose: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    connection: {}, // Add this to avoid missing properties
  })),
}));

// Import the mocked module after mocking
const mongoose = await import('mongoose');
import { connectDBLocal, localMongoose } from '../../src/config/db.js';

// Mock console methods
global.console = {
  log: jest.fn(),
  error: jest.fn()
};

describe('Local Database Connection Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.MONGODB_URI_local = 'mongodb://test-local-uri';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should connect to local MongoDB successfully', async () => {
    const mockMongooseInstance = new mongoose.Mongoose();
    mockMongooseInstance.connect.mockResolvedValueOnce({}); // Resolve immediately

    await connectDBLocal(); // Should now complete instantly

    expect(mockMongooseInstance.connect).toHaveBeenCalledWith('mongodb://test-local-uri');
    expect(console.log).toHaveBeenCalledWith('✅ Local MongoDB Connected Successfully');
  });

  test('should handle connection errors', async () => {
    const mockError = new Error('Connection failed');
    const mockMongooseInstance = mongoose.Mongoose();
    mockMongooseInstance.connect.mockRejectedValueOnce(mockError);

    await connectDBLocal();

    expect(mockMongooseInstance.connect).toHaveBeenCalledWith('mongodb://test-local-uri');
    expect(console.error).toHaveBeenCalledWith('❌ Local MongoDB Connection Error:', 'Connection failed');
    expect(console.log).not.toHaveBeenCalled();
  });

  test('should export localMongoose instance', () => {
    expect(localMongoose).toBeDefined();
  });
});
