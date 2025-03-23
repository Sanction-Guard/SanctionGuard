import { jest } from '@jest/globals';
import { getDataSource, setDataSource, getData } from '../../src/controllers/dataSourceController.js';
import { connections, initializeConnections } from '../../src/utils/dbConnections.js';

// Mock dependencies
jest.mock('../../src/utils/dbConnections.js');

describe('Data Source Controller', () => {
  let mockRequest;
  let mockResponse;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      body: {},
      query: {}
    };
    
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    // Setup default connection mocks
    connections.local = { isConnected: jest.fn().mockReturnValue(true) };
    connections.un = { isConnected: jest.fn().mockReturnValue(true) };
  });

  describe('getDataSource', () => {
    test('should return current data source and connection status', () => {
      // Act
      getDataSource(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        dataSource: expect.any(String),
        connections: {
          local: true,
          un: true
        }
      });
    });
  });

  describe('setDataSource', () => {
    test('should set valid data source', async () => {
      // Setup
      mockRequest.body = { dataSource: 'Local' };

      // Act
      await setDataSource(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Data source set to Local',
        dataSource: 'Local'
      });
    });

    test('should handle invalid data source', async () => {
      // Setup
      mockRequest.body = { dataSource: 'Invalid' };

      // Act
      await setDataSource(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid data source selection'
      });
    });

    test('should handle connection failures', async () => {
      // Setup
      mockRequest.body = { dataSource: 'Local' };
      connections.local.isConnected.mockReturnValue(false);
      initializeConnections.mockImplementation(() => {
        throw new Error('Connection failed');
      });

      // Act
      await setDataSource(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error updating data source',
        error: expect.any(String)
      });
    });
  });

  describe('getData', () => {
    test('should return data for Local source', async () => {
      // Setup
      const mockData = {
        entities: ['entity1'],
        individuals: ['individual1']
      };

      // Mock the model cache
      global.modelCache = {
        local: {
          entities: { find: () => ({ limit: () => mockData.entities }) },
          individuals: { find: () => ({ limit: () => mockData.individuals }) }
        }
      };

      // Act
      await getData(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockData,
        dataSource: expect.any(String)
      });
    });

    test('should handle data fetch errors', async () => {
      // Setup
      const error = new Error('Database error');
      global.modelCache = {
        local: {
          entities: { find: () => { throw error; } }
        }
      };

      // Act
      await getData(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error fetching data',
        error: 'Database error'
      });
    });
  });
});