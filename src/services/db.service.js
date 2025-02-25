import { MongoClient } from 'mongodb';
import { DB_CONFIG } from '../config/db.config.js';
import logger from '../utils/logger.js';

class DatabaseService {
  constructor() {
    this.client = new MongoClient(DB_CONFIG.URI);
    this.connected = false;
  }

  async connect() {
    if (this.connected) return;
    
    try {
      await this.client.connect();
      this.connected = true;
      logger.info('Connected to MongoDB Atlas');
    } catch (err) {
      logger.error('MongoDB connection error:', err);
      throw err;
    }
  }

  getCollection(dbName, collectionName) {
    return this.client.db(dbName).collection(collectionName);
  }

  async disconnect() {
    if (!this.connected) return;
    
    try {
      await this.client.close();
      this.connected = false;
      logger.info('Disconnected from MongoDB Atlas');
    } catch (err) {
      logger.error('MongoDB disconnection error:', err);
      throw err;
    }
  }
}

export default new DatabaseService();