import { jest } from '@jest/globals';

// Global test setup
jest.setTimeout(10000); // 10 second timeout

// Mock global objects if needed
global.console = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
};