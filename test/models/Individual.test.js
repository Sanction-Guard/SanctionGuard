import { jest } from '@jest/globals';
import mongoose from 'mongoose';

// Mock the Individual module first
jest.mock('../../src/models/Individuals.js', () => {
  // Return a mock implementation of the Individual model
  return {
    default: 'mocked-individual-model'
  };
});

// Import after mocking
import Individual from '../../src/models/Individual.js';

// Mock mongoose
jest.mock('mongoose', () => {
  // Create a mock schema with necessary methods and properties
  const mSchema = {
    pre: jest.fn().mockImplementation((event, callback) => {
      // Store the callback for testing
      mSchema.preSaveCallback = callback;
      return mSchema;
    }),
    paths: {
      firstName: { instance: 'String' },
      nationality: { instance: 'Array' }
    }
  };

  return {
    Schema: jest.fn(() => mSchema),
    model: jest.fn().mockReturnValue('mocked-mongoose-model'),
  };
});

describe('Individual Model', () => {
  test('should create schema with correct fields', () => {
    // Assert
    expect(mongoose.Schema).toHaveBeenCalledWith({
      firstName: { type: String, required: true, default: null },
      secondName: { type: String, required: true, default: null },
      thirdName: { type: String, required: true, default: null },
      unListType: { type: String, required: true, default: null },
      referenceNumber: { type: String, required: true },
      title: { type: [String], default: [null] },
      nationality: { type: [String], default: [null] },
      aliasNames: { type: [String], default: [null] },
      addressCity: { type: [String], default: [null] },
      addressCountry: { type: [String], default: [null] },
      dobYear: { type: [String], default: [null] },
      birthCity: { type: [String], default: [null] },
      birthCountry: { type: [String], default: [null] },
      docType: { type: [String], default: [null] },
      docNumber: { type: [String], default: [null] },
      docIssueCountry: { type: [String], default: [null] }
    });
  });

  test('should register pre-save middleware', () => {
    // Get the schema instance
    const schema = mongoose.Schema();
    
    // Assert
    expect(schema.pre).toHaveBeenCalledWith('save', expect.any(Function));
  });

  test('pre-save middleware should transform N/A values', () => {
    // Setup
    const schema = mongoose.Schema();
    const preSaveMiddleware = schema.preSaveCallback; // Get the stored callback
    const mockDoc = {
      firstName: 'N/A',
      nationality: ['N/A', 'USA', 'N/A'],
      schema: {
        paths: {
          firstName: { instance: 'String' },
          nationality: { instance: 'Array' }
        }
      }
    };
    const next = jest.fn();

    // Act
    preSaveMiddleware.call(mockDoc, next);

    // Assert
    expect(mockDoc.firstName).toBe('');
    expect(mockDoc.nationality).toEqual(['', 'USA', '']);
    expect(next).toHaveBeenCalled();
  });

  test('should create model with correct name', () => {
    // Assert
    expect(mongoose.model).toHaveBeenCalledWith('Individual', expect.any(Object));
  });
});