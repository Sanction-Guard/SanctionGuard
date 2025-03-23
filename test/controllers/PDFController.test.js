import { jest } from '@jest/globals';
import fs from 'fs';
import { uploadAndExtract } from '../../src/controllers/PDFController.js';
import { extractAndProcessPDF, saveToDatabase } from '../../src/services/PDFService.js';

// Mock dependencies
jest.mock('fs');
jest.mock('../../src/services/PDFService.js');

describe('PDF Controller', () => {
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      file: {
        path: '/tmp/test.pdf'
      }
    };
    
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };
  });

  test('should process PDF and save data successfully', async () => {
    // Setup
    const mockExtractResult = {
      individuals: ['individual1'],
      entities: ['entity1']
    };
    
    const mockSaveResult = {
      individuals: { insertedCount: 1, modifiedCount: 0 },
      entities: { insertedCount: 1, modifiedCount: 0 }
    };

    extractAndProcessPDF.mockResolvedValueOnce(mockExtractResult);
    saveToDatabase.mockResolvedValueOnce(mockSaveResult);

    // Act
    await uploadAndExtract(mockRequest, mockResponse);

    // Assert
    expect(extractAndProcessPDF).toHaveBeenCalledWith('/tmp/test.pdf');
    expect(saveToDatabase).toHaveBeenCalledWith(['individual1'], ['entity1']);
    expect(fs.unlinkSync).toHaveBeenCalledWith('/tmp/test.pdf');
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Data stored successfully',
      individuals: mockSaveResult.individuals,
      entities: mockSaveResult.entities
    });
  });

  test('should handle missing file', async () => {
    // Setup
    mockRequest.file = null;

    // Act
    await uploadAndExtract(mockRequest, mockResponse);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'No file uploaded or invalid file type.'
    });
  });

  test('should handle processing errors', async () => {
    // Setup
    const error = new Error('PDF processing failed');
    extractAndProcessPDF.mockRejectedValueOnce(error);

    // Act
    await uploadAndExtract(mockRequest, mockResponse);

    // Assert
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      error: 'Failed to process the PDF',
      details: 'PDF processing failed'
    });
    expect(fs.unlinkSync).toHaveBeenCalledWith('/tmp/test.pdf');
  });
});