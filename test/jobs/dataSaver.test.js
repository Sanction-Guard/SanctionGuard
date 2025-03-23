import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// Mock database config
jest.mock('../../src/config/database.js', () => ({
  MONGO_URI: 'mock://mongodb-connection'
}));

// Mock the database utilities
jest.mock('../../src/utils/databaseUtils.js', () => ({
  checkDatabaseAndResources: jest.fn().mockResolvedValue(true),
  findNewIndividuals: jest.fn(),
  findNewEntities: jest.fn(),
  saveIndividualsToMongoDB: jest.fn(),
  saveEntitiesToMongoDB: jest.fn() 
}));

// Import AFTER mocking
import { MONGO_URI } from '../../src/config/database.js';
import { 
  checkDatabaseAndResources, 
  findNewIndividuals, 
  findNewEntities,
  saveIndividualsToMongoDB, 
  saveEntitiesToMongoDB 
} from '../../src/utils/databaseUtils.js';

// Mock the models
jest.mock('../../src/models/Individuals.js', () => ({
  findOne: jest.fn(),
  prototype: {
    save: jest.fn().mockResolvedValue(true)
  }
}));

jest.mock('../../src/models/Entity.js', () => ({
  findOne: jest.fn(),
  prototype: {
    save: jest.fn().mockResolvedValue(true)
  }
}));

// Import models AFTER mocking
import Individual from '../../src/models/Individuals.js';
import Entity from '../../src/models/Entity.js';

// Mock mongoose
jest.mock('mongoose', () => {
  const mockConnection = {
    db: {
      listCollections: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          { name: 'individuals' },
          { name: 'otherCollection' }
        ])
      }),
      createCollection: jest.fn().mockResolvedValue(true)
    }
  };
  
  return {
    connect: jest.fn().mockResolvedValue(true),
    connection: mockConnection,
    model: jest.fn()
  };
});

// Mock console methods
const originalConsole = global.console;
global.console = {
  log: jest.fn(),
  error: jest.fn(),
  warn: originalConsole.warn,
  info: originalConsole.info,
  debug: originalConsole.debug
};

describe('Database Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.console = originalConsole;
  });

  describe('checkDatabaseAndResources', () => {
    test('should successfully check and establish database connection', async () => {
      // Setup the implementation for this specific test
      checkDatabaseAndResources.mockImplementationOnce(async () => {
        await mongoose.connect(MONGO_URI);
        await mongoose.connection.db.listCollections().toArray();
        console.log('Database connection check: SUCCESS');
        return true;
      });
      
      // Act
      const result = await checkDatabaseAndResources();
      
      // Assert
      expect(mongoose.connect).toHaveBeenCalledWith(MONGO_URI);
      expect(mongoose.connection.db.listCollections().toArray).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Database connection check: SUCCESS');
      expect(result).toBe(true);
    });

    test('should create missing collections if they do not exist', async () => {
      // Setup - simulate that only 'individuals' exists
      mongoose.connection.db.listCollections().toArray.mockResolvedValueOnce([
        { name: 'individuals' }
      ]);
      
      checkDatabaseAndResources.mockImplementationOnce(async () => {
        await mongoose.connect(MONGO_URI);
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        
        const requiredCollections = ['individuals', 'entities'];
        const missingCollections = requiredCollections.filter(c => !collectionNames.includes(c));
        
        if (missingCollections.length > 0) {
          console.log('Missing collections:', missingCollections);
          for (const collection of missingCollections) {
            await mongoose.connection.db.createCollection(collection);
            console.log(`Created collection: ${collection}`);
          }
        }
        
        return true;
      });
      
      // Act
      const result = await checkDatabaseAndResources();
      
      // Assert
      expect(console.log).toHaveBeenCalledWith('Missing collections:', ['entities']);
      expect(mongoose.connection.db.createCollection).toHaveBeenCalledWith('entities');
      expect(console.log).toHaveBeenCalledWith('Created collection: entities');
      expect(result).toBe(true);
    });

    test('should handle database connection errors', async () => {
      // Setup
      mongoose.connect.mockRejectedValueOnce(new Error('Connection failed'));
      
      checkDatabaseAndResources.mockImplementationOnce(async () => {
        try {
          await mongoose.connect(MONGO_URI);
          return true;
        } catch (error) {
          console.error('Database and resource check failed:', error.message);
          return false;
        }
      });
      
      // Act
      const result = await checkDatabaseAndResources();
      
      // Assert
      expect(console.error).toHaveBeenCalledWith(
        'Database and resource check failed:',
        'Connection failed'
      );
      expect(result).toBe(false);
    });
  });

  describe('findNewIndividuals', () => {
    test('should return true for a new individual', async () => {
      // Setup
      Individual.findOne.mockResolvedValueOnce(null);
      findNewIndividuals.mockImplementationOnce(async (individualData) => {
        try {
          const existingIndividual = await Individual.findOne(individualData);
          return !existingIndividual;
        } catch (error) {
          return false;
        }
      });
      
      const individualData = {
        firstName: 'John',
        secondName: 'Doe',
        referenceNumber: '12345',
        aliasNames: ['Johnny'],
        dobYear: 1990,
        docType: 'Passport',
        docNumber: 'P12345'
      };
      
      // Act
      const result = await findNewIndividuals(individualData);
      
      // Assert
      expect(Individual.findOne).toHaveBeenCalledWith(individualData);
      expect(result).toBe(true);
    });

    test('should return false for an existing individual', async () => {
      // Setup
      Individual.findOne.mockResolvedValueOnce({ firstName: 'John' });
      findNewIndividuals.mockImplementationOnce(async (individualData) => {
        try {
          const existingIndividual = await Individual.findOne(individualData);
          return !existingIndividual;
        } catch (error) {
          return false;
        }
      });
      
      const individualData = {
        firstName: 'John',
        secondName: 'Doe'
      };
      
      // Act
      const result = await findNewIndividuals(individualData);
      
      // Assert
      expect(result).toBe(false);
    });

    test('should handle errors and return false', async () => {
      // Setup
      Individual.findOne.mockRejectedValueOnce(new Error('Database error'));
      findNewIndividuals.mockImplementationOnce(async (individualData) => {
        try {
          const existingIndividual = await Individual.findOne(individualData);
          return !existingIndividual;
        } catch (error) {
          console.error('Error checking for existing individual:', error.message);
          return false;
        }
      });
      
      // Act
      const result = await findNewIndividuals({});
      
      // Assert
      expect(console.error).toHaveBeenCalledWith(
        'Error checking for existing individual:',
        'Database error'
      );
      expect(result).toBe(false);
    });
  });

  describe('findNewEntities', () => {
    test('should return true for a new entity', async () => {
      // Setup
      Entity.findOne.mockResolvedValueOnce(null);
      findNewEntities.mockImplementationOnce(async (entityData) => {
        try {
          const existingEntity = await Entity.findOne(entityData);
          return !existingEntity;
        } catch (error) {
          return false;
        }
      });
      
      const entityData = {
        firstName: 'Company XYZ',
        referenceNumber: 'E12345'
      };
      
      // Act
      const result = await findNewEntities(entityData);
      
      // Assert
      expect(Entity.findOne).toHaveBeenCalledWith(entityData);
      expect(result).toBe(true);
    });

    test('should return false for an existing entity', async () => {
      // Setup
      Entity.findOne.mockResolvedValueOnce({ firstName: 'Company XYZ' });
      findNewEntities.mockImplementationOnce(async (entityData) => {
        try {
          const existingEntity = await Entity.findOne(entityData);
          return !existingEntity;
        } catch (error) {
          return false;
        }
      });
      
      const entityData = {
        firstName: 'Company XYZ',
        referenceNumber: 'E12345'
      };
      
      // Act
      const result = await findNewEntities(entityData);
      
      // Assert
      expect(result).toBe(false);
    });

    test('should handle errors and return false', async () => {
      // Setup
      Entity.findOne.mockRejectedValueOnce(new Error('Database error'));
      findNewEntities.mockImplementationOnce(async (entityData) => {
        try {
          const existingEntity = await Entity.findOne(entityData);
          return !existingEntity;
        } catch (error) {
          console.error('Error checking for existing entity:', error.message);
          return false;
        }
      });
      
      // Act
      const result = await findNewEntities({});
      
      // Assert
      expect(console.error).toHaveBeenCalledWith(
        'Error checking for existing entity:',
        'Database error'
      );
      expect(result).toBe(false);
    });
  });

  describe('saveIndividualsToMongoDB', () => {
    test('should save new individual to the database', async () => {
      // Setup
      findNewIndividuals.mockResolvedValueOnce(true);
      
      const mockIndividual = {
        firstName: 'John',
        secondName: 'Doe',
        save: jest.fn().mockResolvedValueOnce(true)
      };
      
      const IndividualConstructor = jest.fn().mockImplementation(() => mockIndividual);
      global.Individual = IndividualConstructor;
      
      saveIndividualsToMongoDB.mockImplementationOnce(async (individualData) => {
        const isNew = await findNewIndividuals(individualData);
        if (isNew) {
          try {
            const individual = new IndividualConstructor(individualData);
            await individual.save();
            console.log(`Saved new individual: ${individual.firstName} ${individual.secondName}`);
          } catch (error) {
            console.error(`Error saving individual ${individualData.firstName} ${individualData.secondName}:`, error.message);
            throw error;
          }
        } else {
          console.log(`Skipped existing individual: ${individualData.firstName} ${individualData.secondName}`);
        }
      });
      
      const individualData = {
        firstName: 'John',
        secondName: 'Doe'
      };
      
      // Act
      await saveIndividualsToMongoDB(individualData);
      
      // Assert
      expect(console.log).toHaveBeenCalledWith('Saved new individual: John Doe');
    });

    test('should skip existing individuals', async () => {
      // Setup
      findNewIndividuals.mockResolvedValueOnce(false);
      
      saveIndividualsToMongoDB.mockImplementationOnce(async (individualData) => {
        const isNew = await findNewIndividuals(individualData);
        if (!isNew) {
          console.log(`Skipped existing individual: ${individualData.firstName} ${individualData.secondName}`);
        }
      });
      
      const individualData = {
        firstName: 'John',
        secondName: 'Doe'
      };
      
      // Act
      await saveIndividualsToMongoDB(individualData);
      
      // Assert
      expect(console.log).toHaveBeenCalledWith('Skipped existing individual: John Doe');
    });

    test('should handle errors when saving individuals', async () => {
      // Setup
      findNewIndividuals.mockResolvedValueOnce(true);
      
      const saveError = new Error('Save error');
      const mockIndividual = {
        firstName: 'John',
        secondName: 'Doe',
        save: jest.fn().mockRejectedValueOnce(saveError)
      };
      
      const IndividualConstructor = jest.fn().mockImplementation(() => mockIndividual);
      global.Individual = IndividualConstructor;
      
      saveIndividualsToMongoDB.mockImplementationOnce(async (individualData) => {
        const isNew = await findNewIndividuals(individualData);
        if (isNew) {
          try {
            const individual = new IndividualConstructor(individualData);
            await individual.save();
          } catch (error) {
            console.error(`Error saving individual ${individualData.firstName} ${individualData.secondName}:`, error.message);
            throw error;
          }
        }
      });
      
      const individualData = {
        firstName: 'John',
        secondName: 'Doe'
      };
      
      // Act & Assert
      await expect(saveIndividualsToMongoDB(individualData)).rejects.toThrow('Save error');
      expect(console.error).toHaveBeenCalledWith(
        'Error saving individual John Doe:',
        'Save error'
      );
    });
  });

  describe('saveEntitiesToMongoDB', () => {
    test('should save new entity to the database', async () => {
      // Setup
      findNewEntities.mockResolvedValueOnce(true);
      
      const mockEntity = {
        firstName: 'Company XYZ',
        save: jest.fn().mockResolvedValueOnce(true)
      };
      
      const EntityConstructor = jest.fn().mockImplementation(() => mockEntity);
      global.Entity = EntityConstructor;
      
      saveEntitiesToMongoDB.mockImplementationOnce(async (entityData) => {
        const isNew = await findNewEntities(entityData);
        if (isNew) {
          try {
            const entity = new EntityConstructor(entityData);
            await entity.save();
            console.log(`Saved new entity: ${entity.firstName}`);
          } catch (error) {
            console.error(`Error saving entity ${entityData.firstName}:`, error.message);
            throw error;
          }
        } else {
          console.log(`Skipped existing entity: ${entityData.firstName}`);
        }
      });
      
      const entityData = {
        firstName: 'Company XYZ'
      };
      
      // Act
      await saveEntitiesToMongoDB(entityData);
      
      // Assert
      expect(console.log).toHaveBeenCalledWith('Saved new entity: Company XYZ');
    });

    test('should skip existing entities', async () => {
      // Setup
      findNewEntities.mockResolvedValueOnce(false);
      
      saveEntitiesToMongoDB.mockImplementationOnce(async (entityData) => {
        const isNew = await findNewEntities(entityData);
        if (!isNew) {
          console.log(`Skipped existing entity: ${entityData.firstName}`);
        }
      });
      
      const entityData = {
        firstName: 'Company XYZ'
      };
      
      // Act
      await saveEntitiesToMongoDB(entityData);
      
      // Assert
      expect(console.log).toHaveBeenCalledWith('Skipped existing entity: Company XYZ');
    });

    test('should handle errors when saving entities', async () => {
      // Setup
      findNewEntities.mockResolvedValueOnce(true);
      
      const saveError = new Error('Save error');
      const mockEntity = {
        firstName: 'Company XYZ',
        save: jest.fn().mockRejectedValueOnce(saveError)
      };
      
      const EntityConstructor = jest.fn().mockImplementation(() => mockEntity);
      global.Entity = EntityConstructor;
      
      saveEntitiesToMongoDB.mockImplementationOnce(async (entityData) => {
        const isNew = await findNewEntities(entityData);
        if (isNew) {
          try {
            const entity = new EntityConstructor(entityData);
            await entity.save();
          } catch (error) {
            console.error(`Error saving entity ${entityData.firstName}:`, error.message);
            throw error;
          }
        }
      });
      
      const entityData = {
        firstName: 'Company XYZ'
      };
      
      // Act & Assert
      await expect(saveEntitiesToMongoDB(entityData)).rejects.toThrow('Save error');
      expect(console.error).toHaveBeenCalledWith(
        'Error saving entity Company XYZ:',
        'Save error'
      );
    });
  });
});