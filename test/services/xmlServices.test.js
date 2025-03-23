import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('node-fetch', () => jest.fn());

jest.mock('xml2js', () => ({
  Parser: jest.fn().mockImplementation(() => ({
    parseString: jest.fn()
  }))
}));

jest.mock('../../src/config/constants.js', () => ({
  UN_SANCTIONS_URL: 'https://example.com/sanctions.xml'
}));

jest.mock('../../src/utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../src/utils/extractor.js', () => ({
  extractValues: jest.fn(),
  extractArrayField: jest.fn()
}));

jest.mock('../jobs/dataSaver.js', () => ({
  saveIndividualsToMongoDB: jest.fn(),
  saveEntitiesToMongoDB: jest.fn()
}));

// Import the module under test
import fetch from 'node-fetch';
import { Parser } from 'xml2js';
import { logger } from '../../src/utils/logger.js';
import { extractValues, extractArrayField } from '../../src/utils/extractor.js';
import { saveIndividualsToMongoDB, saveEntitiesToMongoDB } from '../../src/jobs/dataSaver.js';
import { fetchAndParseXML, processIndividuals, processEntities } from '../../src/services/xmlServices.js';

describe('XML Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAndParseXML', () => {
    test('should fetch and parse XML successfully', async () => {
      // Arrange
      const mockXmlText = '<xml>test data</xml>';
      const mockParsedData = { result: 'parsed data' };
      
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(mockXmlText)
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      // Mock the parser.parseString implementation
      const parserInstance = new Parser();
      parserInstance.parseString.mockImplementation((xml, callback) => {
        callback(null, mockParsedData);
      });

      // Act
      const result = await fetchAndParseXML();

      // Assert
      expect(fetch).toHaveBeenCalledWith('https://example.com/sanctions.xml');
      expect(mockResponse.text).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Fetching XML data...');
      expect(result).toEqual(mockParsedData);
    });

    test('should throw error when fetch fails', async () => {
      // Arrange
      fetch.mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(fetchAndParseXML())
        .rejects
        .toThrow('Network error');
      
      expect(logger.error).toHaveBeenCalledWith(
        'Error fetching XML:',
        'Network error'
      );
    });

    test('should throw error when response is not ok', async () => {
      // Arrange
      const mockResponse = {
        ok: false,
        status: 404
      };
      
      fetch.mockResolvedValue(mockResponse);

      // Act & Assert
      await expect(fetchAndParseXML())
        .rejects
        .toThrow('HTTP error! Status: 404');
    });

    test('should throw error when XML parsing fails', async () => {
      // Arrange
      const mockXmlText = '<xml>test data</xml>';
      
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue(mockXmlText)
      };
      
      fetch.mockResolvedValue(mockResponse);
      
      // Mock the parser.parseString implementation to simulate an error
      const parserInstance = new Parser();
      parserInstance.parseString.mockImplementation((xml, callback) => {
        callback(new Error('XML parsing error'), null);
      });

      // Act & Assert
      await expect(fetchAndParseXML())
        .rejects
        .toThrow('Error parsing XML: XML parsing error');
    });
  });

  describe('processIndividuals', () => {
    test('should process individuals from XML result', async () => {
      // Arrange
      const mockResult = {
        CONSOLIDATED_LIST: {
          INDIVIDUALS: {
            INDIVIDUAL: [
              {
                FIRST_NAME: 'John',
                SECOND_NAME: 'Doe',
                THIRD_NAME: '',
                UN_LIST_TYPE: 'Individual',
                REFERENCE_NUMBER: '123'
              },
              {
                FIRST_NAME: 'Jane',
                SECOND_NAME: 'Smith',
                UN_LIST_TYPE: 'Individual',
                REFERENCE_NUMBER: '456'
              }
            ]
          }
        }
      };
      
      extractValues.mockImplementation(val => val ? [val] : []);
      extractArrayField.mockReturnValue(['test-value']);
      
      // Act
      await processIndividuals(mockResult);

      // Assert
      expect(saveIndividualsToMongoDB).toHaveBeenCalledTimes(2);
      expect(saveIndividualsToMongoDB).toHaveBeenCalledWith(expect.objectContaining({
        firstName: 'John',
        secondName: 'Doe',
        thirdName: '',
        referenceNumber: '123'
      }));
      
      expect(saveIndividualsToMongoDB).toHaveBeenCalledWith(expect.objectContaining({
        firstName: 'Jane',
        secondName: 'Smith',
        thirdName: 'N/A',
        referenceNumber: '456'
      }));
    });

    test('should handle case when no individuals are found', async () => {
      // Arrange
      const mockResult = {
        CONSOLIDATED_LIST: {
          INDIVIDUALS: {}
        }
      };
      
      // Mock console.log for this test
      const originalConsoleLog = console.log;
      console.log = jest.fn();

      // Act
      await processIndividuals(mockResult);

      // Assert
      expect(saveIndividualsToMongoDB).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('No individuals found in the XML.');
      
      // Restore console.log
      console.log = originalConsoleLog;
    });
  });

  describe('processEntities', () => {
    test('should process entities from XML result', async () => {
      // Arrange
      const mockResult = {
        CONSOLIDATED_LIST: {
          ENTITIES: {
            ENTITY: [
              {
                FIRST_NAME: 'Acme Corp',
                UN_LIST_TYPE: 'Entity',
                REFERENCE_NUMBER: '789'
              },
              {
                FIRST_NAME: 'Globex Inc',
                UN_LIST_TYPE: 'Entity',
                REFERENCE_NUMBER: '012'
              }
            ]
          }
        }
      };
      
      extractArrayField.mockReturnValue(['test-value']);
      
      // Act
      await processEntities(mockResult);

      // Assert
      expect(saveEntitiesToMongoDB).toHaveBeenCalledTimes(2);
      expect(saveEntitiesToMongoDB).toHaveBeenCalledWith(expect.objectContaining({
        firstName: 'Acme Corp',
        unListType: 'Entity',
        referenceNumber: '789'
      }));
      
      expect(saveEntitiesToMongoDB).toHaveBeenCalledWith(expect.objectContaining({
        firstName: 'Globex Inc',
        unListType: 'Entity',
        referenceNumber: '012'
      }));
    });

    test('should handle case when no entities are found', async () => {
      // Arrange
      const mockResult = {
        CONSOLIDATED_LIST: {
          ENTITIES: {}
        }
      };
      
      // Mock console.log for this test
      const originalConsoleLog = console.log;
      console.log = jest.fn();

      // Act
      await processEntities(mockResult);

      // Assert
      expect(saveEntitiesToMongoDB).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('No entities found in the XML.');
      
      // Restore console.log
      console.log = originalConsoleLog;
    });
  });
});