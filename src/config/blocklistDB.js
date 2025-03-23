// src/config/blocklistDB.js
/**
 * This file provides the MongoDB connection configuration for the BlockList database
 * It ensures that imported data is properly saved to the BlockList database
 * 
 * @author SanctionGuard Development Team
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

// Load environment variables
dotenv.config();

// Create a separate Mongoose instance for the BlockList database
export const blocklistMongoose = new mongoose.Mongoose();

/**
 * Connect to the BlockList MongoDB database
 * This function creates and manages the connection to the BlockList database
 * 
 * @async
 * @returns {Promise<mongoose.Connection>} MongoDB connection
 */
export const connectBlocklistDB = async () => {
    try {
        // Check if we already have a connection
        if (blocklistMongoose.connection.readyState === 1) {
            logger.info('Already connected to BlockList database');
            return blocklistMongoose.connection;
        }

        // Set connection options - these are important for stability
        const options = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        };

        // IMPORTANT: Use a dedicated connection string for the BlockList database
        // Update your .env file to have this variable if it doesn't already
        const connectionString = process.env.BLOCKLIST_DB_URI || 'mongodb+srv://SanctionGuard:SanctionGuard@sanctioncluster.2myce.mongodb.net/BlockList?retryWrites=true&w=majority&appName=SanctionCluster';
        
        // Connect to MongoDB and get the connection
        await blocklistMongoose.connect(connectionString, options);
        
        console.log('✅ BlockList MongoDB Connected Successfully');
        
        // Set up connection event handlers
        blocklistMongoose.connection.on('error', err => {
            console.error('❌ BlockList MongoDB Connection Error:', err);
        });
        
        blocklistMongoose.connection.on('disconnected', () => {
            logger.warn('❌ BlockList database disconnected');
        });
        
        return blocklistMongoose.connection;
    } catch (error) {
        logger.error('Error connecting to BlockList database:', error);
        throw error;
    }
};

export default { blocklistMongoose, connectBlocklistDB };