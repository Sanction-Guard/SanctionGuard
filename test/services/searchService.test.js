import { jest } from '@jest/globals';

// Mock dependencies
jest.mock('string-similarity', () => ({
  compareTwoStrings: jest.fn()
}));

jest.mock('@elastic/elasticsearch', () => ({
  Client: jest.fn().mockImplementation(() => ({
    search: jest.fn(),
    count: jest.fn()
  }))
}));

jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Import the module under test
import stringSimilarity from 'string-similarity';
import { Client } from '@elastic/elasticsearch';
import searchService from '../../src/services/searchService.js';

describe('Search Service', () => {
  const mockClient = new Client();
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ELASTICSEARCH_INDEX = 'test-index';
    
    // Reset the mock implementations for each test
    stringSimilarity.compareTwoStrings
      .mockImplementation((a, b) => a === b ? 1.0 : 0.5);
  });

  describe('performSearch', () => {
    test('should return properly formatted search results', async () => {
      // Arrange
      const searchTerm = 'John Doe';
      const searchType = 'individual';
      
      const mockSearchResponse = {
        hits: {
          hits: [
            {
              _source: {
                firstName: 'John',
                secondName: 'Doe',
                thirdName: '',
                referenceNumber: '123',
                dateOfBirth: '1980-01-01',
                nicNumber: 'ABC123',
                type: 'individual'
              }
            },
            {
              _source: {
                firstName: 'Jane',
                secondName: 'Doe',
                thirdName: '',
                referenceNumber: '456',
                dateOfBirth: '1985-05-05',
                nicNumber: 'DEF456',
                type: 'individual'
              }
            },
            {
              _source: {
                firstName: 'Acme',
                secondName: 'Corp',
                thirdName: '',
                referenceNumber: '789',
                type: 'entity'
              }
            }
          ]
        }
      };
      
      mockClient.search.mockResolvedValue(mockSearchResponse);

      // Act
      const results = await searchService.performSearch(searchTerm, searchType);

      // Assert
      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'test-index',
        body: {
          query: {
            multi_match: {
              query: searchTerm,
              fields: ['firstName', 'secondName', 'thirdName', 'full_name', 'aka', 'aliasNames'],
              fuzziness: 'AUTO',
            },
          },
          size: 1000,
        },
      });
      
      // Should filter to only return individuals
      expect(results.length).toBe(2);
      expect(results[0].referenceNumber).toBe('123');
      expect(results[1].referenceNumber).toBe('456');
      
      // Should include similarity percentage
      expect(results[0].similarityPercentage).toBeDefined();
      expect(results[1].similarityPercentage).toBeDefined();
    });

    test('should throw error when elasticsearch response is invalid', async () => {
      // Arrange
      const searchTerm = 'John Doe';
      mockClient.search.mockResolvedValue({ invalid: 'response' });

      // Act & Assert
      await expect(searchService.performSearch(searchTerm))
        .rejects
        .toThrow('Invalid response from Elasticsearch: response.hits is undefined');
    });
  });

  describe('getDatabaseStatus', () => {
    test('should return database status with total records and last update time', async () => {
      // Arrange
      const mockCountResponse = {
        count: 1500
      };
      
      const mockLatestResponse = {
        hits: {
          hits: [
            {
              _source: {
                created_at: '2023-01-15T10:30:00Z'
              }
            }
          ]
        }
      };
      
      mockClient.count.mockResolvedValue(mockCountResponse);
      mockClient.search.mockResolvedValue(mockLatestResponse);

      // Act
      const status = await searchService.getDatabaseStatus();

      // Assert
      expect(mockClient.count).toHaveBeenCalledWith({
        index: 'test-index'
      });
      
      expect(mockClient.search).toHaveBeenCalledWith({
        index: 'test-index',
        body: {
          size: 1,
          sort: [{ created_at: { order: 'desc' } }],
          _source: ['created_at'],
        },
      });
      
      expect(status.totalRecords).toBe(1500);
      expect(status.lastUpdated).toBeDefined();
    });

    test('should throw error when elasticsearch count response is invalid', async () => {
      // Arrange
      mockClient.count.mockResolvedValue(null);

      // Act & Assert
      await expect(searchService.getDatabaseStatus())
        .rejects
        .toThrow('Invalid response from Elasticsearch: countResponse is undefined');
    });
  });
});