import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../../src/config/userDB.js', () => ({
  User: {
    findById: jest.fn(),
  }
}));

// Import the module under test
import { User } from '../../src/config/userDB.js';
import { getUserById, createUser } from '../../src/services/userService.js';

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Add mock for User constructor
    User.prototype = {
      save: jest.fn().mockResolvedValue({ _id: 'user123' })
    };
  });

  describe('createUser', () => {
    test('should create and save a new user', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'hashedPassword',
        role: 'user'
      };
      
      // Mock constructor
      const mockUserInstance = {
        ...userData,
        save: jest.fn().mockResolvedValue({ _id: 'user123', ...userData })
      };
      
      // Mock the User constructor behavior
      jest.spyOn(global, 'Object').mockImplementationOnce(() => mockUserInstance);

      // Act
      const result = await createUser(userData);

      // Assert
      expect(mockUserInstance.save).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        _id: 'user123',
        email: 'test@example.com',
        role: 'user'
      }));
    });
  });

  describe('getUserById', () => {
    test('should return user when valid ID is provided', async () => {
      // Arrange
      const userId = 'user123';
      const mockUser = {
        _id: userId,
        email: 'test@example.com',
        role: 'user'
      };
      
      User.findById.mockResolvedValue(mockUser);

      // Act
      const result = await getUserById(userId);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    test('should return null when user is not found', async () => {
      // Arrange
      const userId = 'nonexistent';
      User.findById.mockResolvedValue(null);

      // Act
      const result = await getUserById(userId);

      // Assert
      expect(User.findById).toHaveBeenCalledWith(userId);
      expect(result).toBeNull();
    });
  });
});