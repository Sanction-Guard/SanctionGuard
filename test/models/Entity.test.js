import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import Entity from '../../src/models/Entity';

// Mock mongoose
jest.mock('mongoose', () => {
  const mSchema = {
    pre: jest.fn(),
    paths: {
      firstName: { instance: 'String' },
      aliasNames: { instance: 'Array' }
    }
  };

  return {
    Schema: jest.fn(() => mSchema),
    //model: jest.fn(),
  };
});

describe('Entity Model', () => {
  test('should create schema with correct fields', () => {
    // Assert
    expect(mongoose.Schema).toHaveBeenCalledWith({
      firstName: { type: String, required: true, default: null },
      unListType: { type: String, required: true, default: null },
      referenceNumber: { type: String, required: true, default: null },
      aliasNames: { type: [String], default: [null] },
      addressStreet: { type: [String], default: [null] },
      addressCity: { type: [String], default: [null] },
      addressCountry: { type: [String], default: [null] }
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
    const preSaveMiddleware = schema.pre.mock.calls[0][1];
    const mockDoc = {
      firstName: 'N/A',
      aliasNames: ['N/A', 'Valid Name', 'N/A'],
      schema: {
        paths: {
          firstName: { instance: 'String' },
          aliasNames: { instance: 'Array' }
        }
      }
    };
    const next = jest.fn();

    // Act
    preSaveMiddleware.call(mockDoc, next);

    // Assert
    expect(mockDoc.firstName).toBe('');
    expect(mockDoc.aliasNames).toEqual(['', 'Valid Name', '']);
    expect(next).toHaveBeenCalled();
  });

  test('should create model with correct name', () => {
    // Assert
    expect(mongoose.model).toHaveBeenCalledWith('Entity', expect.any(Object));
  });
});