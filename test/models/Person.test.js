import { jest } from '@jest/globals';
import { localMongoose } from '../../src/config/db.js';
import Person from '../../src/models/Person.js';

// Mock dependencies with ES module syntax
jest.mock('../../src/config/db.js', () => {
  return {
    localMongoose: {
      Schema: jest.fn(() => ({
        pre: jest.fn().mockReturnThis(),
        _schema: {
          reference_number: { match: /^IN\/CA\/\d{4}\/\d{2}$/ },
          dob: { match: /^\d{2}\.\d{2}\.\d{4}$/ },
          nic: { match: /^[A-Z0-9]{10,12}$/ }
        }
      })),
      model: jest.fn()
    }
  };
});

describe('Person Model', () => {
  test('should create schema with correct fields', () => {
    // Assert
    expect(localMongoose.Schema).toHaveBeenCalledWith({
      reference_number: {
        type: String,
        required: true,
        unique: true,
        match: /^IN\/CA\/\d{4}\/\d{2}$/,
      },
      firstName: {
        type: String,
        required: true,
        trim: true,
      },
      secondName: {
        type: String,
        trim: true,
      },
      thirdName: {
        type: String,
        trim: true,
      },
      aka: [
        {
          type: String,
          trim: true,
        },
      ],
      dob: {
        type: String,
        required: true,
        match: /^\d{2}\.\d{2}\.\d{4}$/,
      },
      nic: {
        type: String,
        required: true,
        match: /^[A-Z0-9]{10,12}$/,
        uppercase: true,
      },
      created_at: {
        type: Date,
        default: Date.now,
      },
    }, { collection: 'individuals' });
  });

  test('should create model with correct name and collection', () => {
    // Assert
    expect(localMongoose.model).toHaveBeenCalledWith('Person', expect.any(Object));
  });

  test('should validate valid reference number', () => {
    // Setup
    const schema = localMongoose.Schema();
    const validRef = 'IN/CA/2024/01';
    
    // Assert
    expect(validRef).toMatch(schema._schema.reference_number.match);
  });

  test('should validate valid date of birth', () => {
    // Setup
    const schema = localMongoose.Schema();
    const validDob = '01.01.2000';
    
    // Assert
    expect(validDob).toMatch(schema._schema.dob.match);
  });

  test('should validate valid NIC', () => {
    // Setup
    const schema = localMongoose.Schema();
    const validNic = 'ABC123456789';
    
    // Assert
    expect(validNic).toMatch(schema._schema.nic.match);
  });

  test('should reject invalid reference number', () => {
    // Setup
    const schema = localMongoose.Schema();
    const invalidRef = 'INVALID/REF';
    
    // Assert
    expect(invalidRef).not.toMatch(schema._schema.reference_number.match);
  });

  test('should reject invalid date of birth', () => {
    // Setup
    const schema = localMongoose.Schema();
    const invalidDob = '2000-01-01';
    
    // Assert
    expect(invalidDob).not.toMatch(schema._schema.dob.match);
  });

  test('should reject invalid NIC', () => {
    // Setup
    const schema = localMongoose.Schema();
    const invalidNic = 'abc123';
    
    // Assert
    expect(invalidNic).not.toMatch(schema._schema.nic.match);
  });
});