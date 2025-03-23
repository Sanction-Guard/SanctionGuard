// src/config/blocklistDB.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

// Create a separate Mongoose instance for BlockList database
const blocklistMongoose = new mongoose.Mongoose();

// Get the BlockList MongoDB URI from environment variable
// Example URI: mongodb+srv://username:password@cluster.mongodb.net/BlockList?retryWrites=true&w=majority
const BLOCKLIST_URI = process.env.MONGODB_URI_BLOCKLIST || 
                     'mongodb://localhost:27017/BlockList';

/**
 * Connect to the BlockList database
 * @returns {Promise<Object>} Mongoose connection
 */
export const connectBlocklistDB = async () => {
    try {
        await blocklistMongoose.connect(BLOCKLIST_URI);
        logger.info('✅ BlockList MongoDB Connected Successfully');
        return blocklistMongoose.connection;
    } catch (error) {
        logger.error('❌ BlockList MongoDB Connection Error:', error.message);
        throw error;
    }
};

export const checkBlocklistConnection = async () => {
    try {
        if (blocklistMongoose.connection.readyState !== 1) {
            logger.info('Reconnecting to BlockList MongoDB...');
            await connectBlocklistDB();
        }
        return true;
    } catch (error) {
        logger.error('Failed to connect to BlockList MongoDB:', error);
        return false;
    }
};

// Export the BlockList Mongoose instance
export { blocklistMongoose };
