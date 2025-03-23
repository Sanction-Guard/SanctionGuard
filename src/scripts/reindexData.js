// scripts/reindexData.js
/**
 * Utility script to reindex all BlockList data to Elasticsearch
 * 
 * This script can be run independently to:
 * 1. Rebuild the Elasticsearch index after changes to mapping
 * 2. Recover from Elasticsearch data loss
 * 3. Initialize a new Elasticsearch instance with existing data
 * 
 * @author SanctionGuard Development Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from '../src/utils/logger.js';
import BlockListIndividual from '../src/models/BlockListIndividual.js';
import BlockListEntity from '../src/models/BlockListEntity.js';
import importElasticsearchService from '../src/services/importElasticsearchService.js';

// Load environment variables from .env file
dotenv.config();

/**
 * Connect to MongoDB using the connection string from environment variables
 * 
 * @async
 * @returns {Promise<void>}
 */
async function connectToMongoDB() {
    try {
        // Get the connection string for the BlockList database
        const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/blocklist';
        
        // Connect to MongoDB with appropriate options
        await mongoose.connect(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        logger.info('Connected to MongoDB successfully');
    } catch (error) {
        logger.error('Failed to connect to MongoDB:', error);
        throw error;
    }
}

/**
 * Main function to reindex all BlockList data to Elasticsearch
 * 
 * @async
 * @returns {Promise<void>}
 */
async function reindexAll() {
    try {
        logger.info('Starting reindexing of all BlockList data to Elasticsearch');
        
        // Connect to MongoDB
        await connectToMongoDB();
        logger.info('Connected to BlockList database');
        
        // Initialize Elasticsearch connection
        const elasticsearchStatus = await importElasticsearchService.initializeElasticsearch();
        if (!elasticsearchStatus) {
            throw new Error('Failed to connect to Elasticsearch');
        }
        logger.info('Connected to Elasticsearch successfully');
        
        // Reindex individuals and get the count
        const totalIndividuals = await reindexIndividuals();
        logger.info(`Successfully reindexed ${totalIndividuals} individuals to Elasticsearch`);
        
        // Reindex entities and get the count
        const totalEntities = await reindexEntities();
        logger.info(`Successfully reindexed ${totalEntities} entities to Elasticsearch`);
        
        // Log completion message
        logger.info('Reindexing completed successfully');
        logger.info(`Total records indexed: ${totalIndividuals + totalEntities}`);
        
        // Close MongoDB connection
        await mongoose.connection.close();
        logger.info('Database connection closed');
        
        // Success exit
        process.exit(0);
    } catch (error) {
        // Log error details
        logger.error('Error during reindexing process:', error);
        
        // Try to close the connection if it exists
        try {
            if (mongoose.connection.readyState !== 0) {
                await mongoose.connection.close();
                logger.info('Database connection closed after error');
            }
        } catch (closeError) {
            logger.error('Error closing database connection:', closeError);
        }
        
        // Exit with error code
        process.exit(1);
    }
}

/**
 * Reindex all BlockList individuals to Elasticsearch
 * Process in batches to avoid memory issues with large datasets
 * 
 * @async
 * @returns {Promise<number>} - Number of indexed individuals
 */
async function reindexIndividuals() {
    // Get total count for progress reporting
    const totalCount = await BlockListIndividual.countDocuments();
    logger.info(`Found ${totalCount} individuals to reindex`);
    
    // Initialize counter for processed records
    let processedCount = 0;
    // Define batch size for processing (adjust based on memory constraints)
    const batchSize = 100;
    
    // Process in batches to avoid memory issues
    for (let skip = 0; skip < totalCount; skip += batchSize) {
        try {
            // Fetch a batch of individuals using pagination
            const individuals = await BlockListIndividual.find()
                .skip(skip)  // Skip previously processed records
                .limit(batchSize)  // Take only up to batchSize records
                .lean();  // Return plain objects instead of Mongoose documents (more efficient)
            
            if (individuals.length > 0) {
                // Index the batch to Elasticsearch
                await importElasticsearchService.bulkIndex(individuals, 'individual');
                processedCount += individuals.length;
                
                // Calculate and log progress percentage
                const progress = ((processedCount / totalCount) * 100).toFixed(2);
                logger.info(`Reindexed ${processedCount}/${totalCount} individuals (${progress}%)`);
            }
        } catch (batchError) {
            // Log batch error but continue with next batch
            logger.error(`Error processing individuals batch at offset ${skip}:`, batchError);
        }
    }
    
    return processedCount;
}

/**
 * Reindex all BlockList entities to Elasticsearch
 * Process in batches to avoid memory issues with large datasets
 * 
 * @async
 * @returns {Promise<number>} - Number of indexed entities
 */
async function reindexEntities() {
    // Get total count for progress reporting
    const totalCount = await BlockListEntity.countDocuments();
    logger.info(`Found ${totalCount} entities to reindex`);
    
    // Initialize counter for processed records
    let processedCount = 0;
    // Define batch size for processing (adjust based on memory constraints)
    const batchSize = 100;
    
    // Process in batches to avoid memory issues
    for (let skip = 0; skip < totalCount; skip += batchSize) {
        try {
            // Fetch a batch of entities using pagination
            const entities = await BlockListEntity.find()
                .skip(skip)  // Skip previously processed records
                .limit(batchSize)  // Take only up to batchSize records
                .lean();  // Return plain objects instead of Mongoose documents (more efficient)
            
            if (entities.length > 0) {
                // Index the batch to Elasticsearch
                await importElasticsearchService.bulkIndex(entities, 'entity');
                processedCount += entities.length;
                
                // Calculate and log progress percentage
                const progress = ((processedCount / totalCount) * 100).toFixed(2);
                logger.info(`Reindexed ${processedCount}/${totalCount} entities (${progress}%)`);
            }
        } catch (batchError) {
            // Log batch error but continue with next batch
            logger.error(`Error processing entities batch at offset ${skip}:`, batchError);
        }
    }
    
    return processedCount;
}

// Execute the main function when the script is run directly
if (require.main === module) {
    logger.info('Starting reindexing script...');
    reindexAll().catch(error => {
        logger.error('Unhandled error in reindexing script:', error);
        process.exit(1);
    });
}