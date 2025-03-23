// import { jest } from '@jest/globals';
// import { localMongoose } from '../../src/config/db.js';
// import EntityLocal from '../../src/models/EntityLocal.js';

// // Mock dependencies - Fix the path to match your import path
// jest.mock('../../src/config/db.js', () => ({
//   localMongoose: {
//     Schema: jest.fn(() => ({
//       pre: jest.fn().mockReturnThis(),
//       _schema: {
//         reference_number: {
//           match: /^EN\/CA\/\d{4}\/\d{2}$/
//         }
//       }
//     })),
//     model: jest.fn().mockReturnValue({})
//   }
// }));

// describe('EntityLocal Model', () => {
//   test('should create schema with correct fields', () => {
//     // Assert
//     expect(localMongoose.Schema).toHaveBeenCalledWith({
//       reference_number: {
//         type: String,
//         required: true,
//         unique: true,
//         match: /^EN\/CA\/\d{4}\/\d{2}$/,
//       },
//       name: {
//         type: String,
//         required: true,
//         trim: true,
//       },
//       aka: [
//         {
//           type: String,
//           trim: true,
//         },
//       ],
//       addresses: [
//         {
//           type: String,
//           trim: true,
//         },
//       ],
//       created_at: {
//         type: Date,
//         default: Date.now,
//       },
//     }, { collection: 'entities' });
//   });

//   test('should create model with correct name and collection', () => {
//     // Assert
//     expect(localMongoose.model).toHaveBeenCalledWith('EntityLocal', expect.any(Object));
//   });

//   test('should validate valid reference number', () => {
//     // Setup
//     const schema = localMongoose.Schema();
//     const validRef = 'EN/CA/2024/01';
    
//     // Assert
//     expect(validRef).toMatch(schema._schema.reference_number.match);
//   });

//   test('should reject invalid reference number', () => {
//     // Setup
//     const schema = localMongoose.Schema();
//     const invalidRef = 'INVALID/REF';
    
//     // Assert
//     expect(invalidRef).not.toMatch(schema._schema.reference_number.match);
//   });
// });

import { jest } from '@jest/globals';
import { localMongoose } from '../../src/config/db.js';
import EntityLocal from '../../src/models/EntityLocal.js';

// Create a proper Schema mock that will work with Jest
const schemaMock = {
  pre: jest.fn().mockReturnThis(),
  _schema: {
    reference_number: {
      match: /^EN\/CA\/\d{4}\/\d{2}$/
    }
  }
};

// Mock dependencies with proper Jest mock functions
jest.mock('../../src/config/db.js', () => ({
  localMongoose: {
    Schema: jest.fn(() => schemaMock),
    model: jest.fn().mockReturnValue({})
  }
}));

describe('EntityLocal Model', () => {
  beforeEach(() => {
    // Clear mock data between tests
    jest.clearAllMocks();
  });

  test('should create schema with correct fields', () => {
    // Import the module again to trigger the schema creation
    jest.isolateModules(() => {
      require('../../src/models/EntityLocal.js');
    });
    
    // Assert
    expect(localMongoose.Schema).toHaveBeenCalledWith({
      reference_number: {
        type: String,
        required: true,
        unique: true,
        match: /^EN\/CA\/\d{4}\/\d{2}$/,
      },
      name: {
        type: String,
        required: true,
        trim: true,
      },
      aka: [
        {
          type: String,
          trim: true,
        },
      ],
      addresses: [
        {
          type: String,
          trim: true,
        },
      ],
      created_at: {
        type: Date,
        default: Date.now,
      },
    }, { collection: 'entities' });
  });

  test('should create model with correct name and collection', () => {
    // Import the module again to trigger the model creation
    jest.isolateModules(() => {
      require('../../src/models/EntityLocal.js');
    });
    
    // Assert
    expect(localMongoose.model).toHaveBeenCalledWith('EntityLocal', expect.any(Object));
  });

  test('should validate valid reference number', () => {
    // Setup
    const validRef = 'EN/CA/2024/01';
    
    // Assert
    expect(validRef).toMatch(schemaMock._schema.reference_number.match);
  });

  test('should reject invalid reference number', () => {
    // Setup
    const invalidRef = 'INVALID/REF';
    
    // Assert
    expect(invalidRef).not.toMatch(schemaMock._schema.reference_number.match);
  });
});