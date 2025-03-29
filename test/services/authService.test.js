import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('test-token')
}));

jest.mock('bcryptjs', () => ({
  compare: jest.fn()
}));

jest.mock('../../src/config/userDB.js', () => ({
  User: {
    findOne: jest.fn()
  }
}));

// Import the module under test
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../../src/config/userDB.js';
import { login } from '../../src/services/authService.js';

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  test('login should return a token when credentials are valid', async () => {
    // Arrange
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      password: 'hashedPassword',
      role: 'user'
    };
    
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);

    // Act
    const result = await login('test@example.com', 'password123');

    // Assert
    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 'user123', role: 'user' },
      'test-secret',
      { expiresIn: '1h' }
    );
    expect(result).toBe('test-token');
  });

  test('login should throw error when user is not found', async () => {
    // Arrange
    User.findOne.mockResolvedValue(null);

    // Act & Assert
    await expect(login('nonexistent@example.com', 'password123'))
      .rejects
      .toThrow('User not found');
    
    expect(User.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
    expect(bcrypt.compare).not.toHaveBeenCalled();
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  test('login should throw error when password is invalid', async () => {
    // Arrange
    const mockUser = {
      _id: 'user123',
      email: 'test@example.com',
      password: 'hashedPassword',
      role: 'user'
    };
    
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    // Act & Assert
    await expect(login('test@example.com', 'wrongPassword'))
      .rejects
      .toThrow('Invalid credentials');
    
    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', 'hashedPassword');
    expect(jwt.sign).not.toHaveBeenCalled();
  });
});