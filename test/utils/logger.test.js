import { jest } from '@jest/globals';
import { logger } from '../../src/utils/logger.js';

describe('Logger Utility', () => {
  // Save original console methods and mock them
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    // Mock console methods before each test
    console.log = jest.fn();
    console.error = jest.fn();
    
    // Mock Date to return a consistent timestamp
    const mockDate = new Date('2023-01-01T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
  });
  
  afterEach(() => {
    // Restore Date
    jest.restoreAllMocks();
  });
  
  afterAll(() => {
    // Restore console methods after all tests
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });
  
  test('should log info messages with timestamp', () => {
    // Act
    logger.info('Test info message');
    
    // Assert
    expect(console.log).toHaveBeenCalledWith(
      '[INFO] 2023-01-01T12:00:00.000Z: Test info message'
    );
  });
  
  test('should log error messages with timestamp', () => {
    // Setup
    const testError = new Error('Test error object');
    
    // Act
    logger.error('Test error message', testError);
    
    // Assert
    expect(console.error).toHaveBeenCalledWith(
      '[ERROR] 2023-01-01T12:00:00.000Z: Test error message',
      testError
    );
  });
  
  test('should handle error logging without error object', () => {
    // Act
    logger.error('Error message only');
    
    // Assert
    expect(console.error).toHaveBeenCalledWith(
      '[ERROR] 2023-01-01T12:00:00.000Z: Error message only',
      undefined
    );
  });
});