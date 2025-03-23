import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('../utils/pdfExtractor.js', () => ({
  extractTextFromPDF: jest.fn(),
  processExtractedText: jest.fn()
}));

jest.mock('../../src/models/Person.js', () => ({
  bulkWrite: jest.fn()
}));

jest.mock('../models/EntityLocal.js', () => ({
  bulkWrite: jest.fn()
}));

// Import the module under test
import { extractTextFromPDF, processExtractedText } from '../../src/utils/pdfExtractor.js';
import Person from '../../src/models/Person.js';
import EntityLocal from '../../src/models/EntityLocal.js';
import { extractAndProcessPDF, saveToDatabase } from '../../src/services/pdfService.js';

describe('PDF Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractAndProcessPDF', () => {
    test('should extract and process PDF text correctly', async () => {
      // Arrange
      const filePath = '/path/to/file.pdf';
      const mockExtractedText = 'Sample text from PDF';
      const mockProcessedData = {
        individuals: [{ name: 'John Doe', reference_number: '123' }],
        entities: [{ name: 'Acme Corp', reference_number: '456' }]
      };
      
      extractTextFromPDF.mockResolvedValue(mockExtractedText);
      processExtractedText.mockReturnValue(mockProcessedData);

      // Act
      const result = await extractAndProcessPDF(filePath);

      // Assert
      expect(extractTextFromPDF).toHaveBeenCalledWith(filePath);
      expect(processExtractedText).toHaveBeenCalledWith(mockExtractedText);
      expect(result).toEqual(mockProcessedData);
    });

    test('should throw error when extraction fails', async () => {
      // Arrange
      const filePath = '/path/to/file.pdf';
      extractTextFromPDF.mockRejectedValue(new Error('Extraction failed'));

      // Act & Assert
      await expect(extractAndProcessPDF(filePath))
        .rejects
        .toThrow('Failed to extract and process PDF');
      
      expect(extractTextFromPDF).toHaveBeenCalledWith(filePath);
      expect(processExtractedText).not.toHaveBeenCalled();
    });
  });

  describe('saveToDatabase', () => {
    test('should save individuals and entities to database', async () => {
      // Arrange
      const individuals = [
        { name: 'John Doe', reference_number: '123' },
        { name: 'Jane Smith', reference_number: '124' }
      ];
      
      const entities = [
        { name: 'Acme Corp', reference_number: '456' },
        { name: 'Globex Inc', reference_number: '457' }
      ];
      
      const individualBulkWriteResult = {
        upsertedCount: 1,
        modifiedCount: 1
      };
      
      const entityBulkWriteResult = {
        upsertedCount: 2,
        modifiedCount: 0
      };
      
      Person.bulkWrite.mockResolvedValue(individualBulkWriteResult);
      EntityLocal.bulkWrite.mockResolvedValue(entityBulkWriteResult);

      // Act
      const result = await saveToDatabase(individuals, entities);

      // Assert
      expect(Person.bulkWrite).toHaveBeenCalledWith([
        {
          updateOne: {
            filter: { reference_number: '123' },
            update: { $set: { name: 'John Doe', reference_number: '123' } },
            upsert: true,
          },
        },
        {
          updateOne: {
            filter: { reference_number: '124' },
            update: { $set: { name: 'Jane Smith', reference_number: '124' } },
            upsert: true,
          },
        }
      ]);
      
      expect(EntityLocal.bulkWrite).toHaveBeenCalledWith([
        {
          updateOne: {
            filter: { reference_number: '456' },
            update: { $set: { name: 'Acme Corp', reference_number: '456' } },
            upsert: true,
          },
        },
        {
          updateOne: {
            filter: { reference_number: '457' },
            update: { $set: { name: 'Globex Inc', reference_number: '457' } },
            upsert: true,
          },
        }
      ]);
      
      expect(result).toEqual({
        individuals: {
          insertedCount: 1,
          modifiedCount: 1,
        },
        entities: {
          insertedCount: 2,
          modifiedCount: 0,
        },
      });
    });

    test('should throw error when database save fails', async () => {
      // Arrange
      const individuals = [{ name: 'John Doe', reference_number: '123' }];
      const entities = [{ name: 'Acme Corp', reference_number: '456' }];
      
      Person.bulkWrite.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(saveToDatabase(individuals, entities))
        .rejects
        .toThrow('Failed to save data to the database');
    });
  });
});