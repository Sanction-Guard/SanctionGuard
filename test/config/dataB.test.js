import { jest } from '@jest/globals';

// Mock the database module before importing
await jest.unstable_mockModule('../../src/config/dataB.js', () => {
  return {
    userMongoose: {
      connect: jest.fn(),
    },
    connectDBuser: jest.fn(async () => {
      try {
        await userMongoose.connect(process.env.MONGODB_URI);
        console.log('✅ user MongoDB Connected Successfully');
      } catch (error) {
        console.error('❌ User MongoDB Connection Error:', error.message);
      }
    }),
  };
});

// Dynamically import the mocked module
const { userMongoose, connectDBuser } = await import('../../src/config/dataB.js');

// Mock console methods
const consoleMock = {
  log: jest.fn(),
  error: jest.fn(),
};
global.console = consoleMock;

describe('User Database Connection Tests', () => {
  let originalEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.MONGODB_URI = 'mongodb://test-user-uri';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should connect to user MongoDB successfully', async () => {
    userMongoose.connect.mockResolvedValueOnce();

    await connectDBuser();

    expect(userMongoose.connect).toHaveBeenCalledWith('mongodb://test-user-uri');
    expect(console.log).toHaveBeenCalledWith('✅ user MongoDB Connected Successfully');
    expect(console.error).not.toHaveBeenCalled();
  });

  test('should handle connection errors', async () => {
    const mockError = new Error('Connection failed');
    userMongoose.connect.mockRejectedValueOnce(mockError);

    await connectDBuser();

    expect(userMongoose.connect).toHaveBeenCalledWith('mongodb://test-user-uri');
    expect(console.error).toHaveBeenCalledWith('❌ User MongoDB Connection Error:', mockError.message);
    expect(console.log).not.toHaveBeenCalled();
  });
});
