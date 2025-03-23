// src/services/importElasticsearchService.js
/**
 * This service provides functionality for indexing imported data to Elasticsearch
 * It is separate from the main search service to avoid modifying existing code
 * 
 * @author SanctionGuard Development Team
 * @version 1.0.0
 */

import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

// Load environment variables from .env file to access configuration
dotenv.config();

/**
 * Create Elasticsearch client instance with authentication from environment variables
 * This uses the same Elasticsearch instance as the search service but with a
 * separate client to avoid dependencies
 */
const client = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD,
  },
});

// Store the index name from environment variables for consistent reference
const ELASTICSEARCH_INDEX = process.env.ELASTICSEARCH_INDEX;

/**
 * Checks connection to Elasticsearch and verifies index existence
 * Creates the index with appropriate mappings if it doesn't exist
 * 
 * @async
 * @returns {Promise<boolean>} True if connection successful, false otherwise
 */
export const initializeElasticsearch = async () => {
  try {
    // First, check if we can connect to Elasticsearch at all
    logger.info('Testing Elasticsearch connection...');
    const healthCheck = await client.cluster.health();
    logger.info(`Elasticsearch cluster status: ${healthCheck.status}`);
    
    // Next, check if our index already exists
    logger.info(`Checking if index ${ELASTICSEARCH_INDEX} exists...`);
    const indexExists = await client.indices.exists({ index: ELASTICSEARCH_INDEX });
    
    // If the index doesn't exist, create it with proper mappings
    if (!indexExists) {
      logger.info(`Creating index ${ELASTICSEARCH_INDEX}...`);
      
      // Define index mappings with appropriate data types for each field
      // This is critical for efficient searching and proper text analysis
      await client.indices.create({
        index: ELASTICSEARCH_INDEX,
        body: {
          mappings: {
            properties: {
              // Individual fields - these are specific to person records
              firstName: { type: 'text', analyzer: 'standard' },
              secondName: { type: 'text', analyzer: 'standard' },
              thirdName: { type: 'text', analyzer: 'standard' },
              dateOfBirth: { type: 'keyword' }, // Exact match field
              nicNumber: { type: 'keyword' },   // Exact match field
              aliasNames: { type: 'text', analyzer: 'standard' },
              
              // Entity fields - these are specific to company/organization records
              name: { type: 'text', analyzer: 'standard' },
              
              // Common fields shared by both individuals and entities
              referenceNumber: { type: 'keyword' }, // Exact match field
              source: { type: 'keyword' },          // Exact match field
              type: { type: 'keyword' },            // 'individual' or 'entity'
              created_at: { type: 'date' },
              updated_at: { type: 'date' },
              full_name: { type: 'text', analyzer: 'standard' }, // Used for search optimization
              isActive: { type: 'boolean' }
            }
          }
        }
      });
      logger.info(`Created Elasticsearch index: ${ELASTICSEARCH_INDEX}`);
    } else {
      logger.info(`Index ${ELASTICSEARCH_INDEX} already exists`);
    }
    
    // Return true to indicate successful initialization
    return true;
  } catch (error) {
    // Log the error and return false to indicate initialization failure
    logger.error('Elasticsearch initialization error:', error);
    return false;
  }
};

/**
 * Index a single individual record to Elasticsearch
 * This is used for real-time indexing of newly created/updated individuals
 * 
 * @async
 * @param {Object} individual - Individual record from BlockList database
 * @returns {Promise<Object>} - Elasticsearch response
 */
export const indexIndividual = async (individual) => {
  try {
    // Create a full name by combining name parts - this improves search effectiveness
    const fullName = `${individual.firstName || ''} ${individual.secondName || ''} ${individual.thirdName || ''}`.trim();
    
    // Create the document object to be indexed in Elasticsearch
    // This format matches the fields defined in our index mapping
    const document = {
      id: individual._id.toString(),
      referenceNumber: individual.referenceNumber,
      firstName: individual.firstName,
      secondName: individual.secondName,
      thirdName: individual.thirdName,
      full_name: fullName,  // Add combined name field for better searching
      aliasNames: individual.aliasNames || [],
      dateOfBirth: individual.dateOfBirth,
      nicNumber: individual.nicNumber,
      source: individual.source,
      sourceFile: individual.sourceFile,
      listType: individual.listType,
      isActive: individual.isActive,
      type: 'individual',  // Explicit type to differentiate from entities
      created_at: individual.created || new Date(),
      updated_at: new Date()
    };
    
    // Make the API call to Elasticsearch to index the document
    // Using refresh:true ensures the document is immediately searchable
    const response = await client.index({
      index: ELASTICSEARCH_INDEX,
      id: individual._id.toString(),  // Use MongoDB ID as Elasticsearch ID for consistency
      body: document,
      refresh: true  // Make document available for search immediately
    });
    
    logger.info(`Indexed individual to Elasticsearch: ${individual.referenceNumber}`);
    return response;
  } catch (error) {
    // Log the error but let the caller handle it
    logger.error(`Error indexing individual ${individual.referenceNumber}:`, error);
    throw error;
  }
};

/**
 * Index a single entity record to Elasticsearch
 * This is used for real-time indexing of newly created/updated entities
 * 
 * @async
 * @param {Object} entity - Entity record from BlockList database
 * @returns {Promise<Object>} - Elasticsearch response
 */
export const indexEntity = async (entity) => {
  try {
    // Create the document object to be indexed in Elasticsearch
    // Format matches the fields defined in our index mapping
    const document = {
      id: entity._id.toString(),
      referenceNumber: entity.referenceNumber,
      name: entity.name,
      full_name: entity.name,  // Use name as full_name for entities
      aliasNames: entity.aliasNames || [],
      addresses: entity.addresses || [],
      source: entity.source,
      sourceFile: entity.sourceFile,
      listType: entity.listType,
      isActive: entity.isActive,
      type: 'entity',  // Explicit type to differentiate from individuals
      created_at: entity.created || new Date(),
      updated_at: new Date()
    };
    
    // Make the API call to Elasticsearch to index the document
    const response = await client.index({
      index: ELASTICSEARCH_INDEX,
      id: entity._id.toString(),  // Use MongoDB ID as Elasticsearch ID for consistency
      body: document,
      refresh: true  // Make document available for search immediately
    });
    
    logger.info(`Indexed entity to Elasticsearch: ${entity.referenceNumber}`);
    return response;
  } catch (error) {
    // Log the error but let the caller handle it
    logger.error(`Error indexing entity ${entity.referenceNumber}:`, error);
    throw error;
  }
};

/**
 * Bulk index multiple records to Elasticsearch
 * This is more efficient than indexing records one by one
 * 
 * @async
 * @param {Array} records - Array of records to index
 * @param {string} type - Type of records ('individual' or 'entity')
 * @returns {Promise<Object>} - Elasticsearch bulk response
 */
export const bulkIndex = async (records, type) => {
  // Return immediately if no records to process
  if (!records || records.length === 0) {
    logger.warn('No records to bulk index');
    return { errors: false };
  }
  
  try {
    // Create a flat array with operation and document pairs
    // The flatMap transforms each record into two objects (operation and document)
    const operations = records.flatMap(record => {
      // Choose the correct document preparation function based on record type
      const processor = type === 'individual' ? prepareIndividualDocument : prepareEntityDocument;
      const document = processor(record);
      
      return [
        // Operation object - specifies the action and target
        { index: { _index: ELASTICSEARCH_INDEX, _id: record._id.toString() } },
        // Document object - the actual data to index
        document
      ];
    });
    
    // Make the bulk API call to Elasticsearch
    const { body } = await client.bulk({ refresh: true, operations });
    
    // Check for any errors in the response
    if (body.errors) {
      // Extract and log error details for investigation
      const errorDetails = body.items
        .filter(item => item.index.error)
        .map(item => item.index.error);
      
      logger.error(`Bulk indexing encountered errors: ${JSON.stringify(errorDetails)}`);
    }
    
    logger.info(`Bulk indexed ${records.length} ${type} records to Elasticsearch`);
    return body;
  } catch (error) {
    // Log the error but let the caller handle it
    logger.error(`Error bulk indexing ${type} records:`, error);
    throw error;
  }
};

/**
 * Prepare an individual document for indexing
 * Creates a properly formatted document for Elasticsearch from a database record
 * 
 * @param {Object} individual - Individual record from database
 * @returns {Object} - Document ready for Elasticsearch indexing
 */
function prepareIndividualDocument(individual) {
  // Create a full name by combining name parts
  const fullName = `${individual.firstName || ''} ${individual.secondName || ''} ${individual.thirdName || ''}`.trim();
  
  // Return a formatted document object
  return {
    id: individual._id.toString(),
    referenceNumber: individual.referenceNumber,
    firstName: individual.firstName,
    secondName: individual.secondName,
    thirdName: individual.thirdName,
    full_name: fullName,
    aliasNames: individual.aliasNames || [],
    dateOfBirth: individual.dateOfBirth,
    nicNumber: individual.nicNumber,
    source: individual.source,
    sourceFile: individual.sourceFile,
    listType: individual.listType,
    isActive: individual.isActive,
    type: 'individual',
    created_at: individual.created || new Date(),
    updated_at: new Date()
  };
}

/**
 * Prepare an entity document for indexing
 * Creates a properly formatted document for Elasticsearch from a database record
 * 
 * @param {Object} entity - Entity record from database
 * @returns {Object} - Document ready for Elasticsearch indexing
 */
function prepareEntityDocument(entity) {
  // Return a formatted document object
  return {
    id: entity._id.toString(),
    referenceNumber: entity.referenceNumber,
    name: entity.name,
    full_name: entity.name,  // Use name as full_name for search consistency
    aliasNames: entity.aliasNames || [],
    addresses: entity.addresses || [],
    source: entity.source,
    sourceFile: entity.sourceFile,
    listType: entity.listType,
    isActive: entity.isActive,
    type: 'entity',
    created_at: entity.created || new Date(),
    updated_at: new Date()
  };
}

// Export a default object with all service functions
export default { 
  initializeElasticsearch,
  indexIndividual,
  indexEntity,
  bulkIndex
};
