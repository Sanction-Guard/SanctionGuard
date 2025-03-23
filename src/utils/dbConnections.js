import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const dbConfig = {
  local: {
    uri: process.env.MONGODB_URI_local,
    options: {
      maxPoolSize: 10, // Set connection pool size
      serverSelectionTimeoutMS: 5000, // Timeout for server selection
      socketTimeoutMS: 45000, // Timeout for socket operations
    },
  },
  un: {
    uri: process.env.UN_MONGODB_URI,
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    },
  },
};

// Validate environment variables
if (!dbConfig.local.uri || !dbConfig.un.uri) {
  throw new Error('Missing MongoDB URI in environment variables');
}

// Schemas
const entitySchema = new mongoose.Schema(
    {
      entityId: { type: String, required: true, unique: true },
      name: { type: String, required: true },
      status: { type: String, enum: ['active', 'inactive'], default: 'active' },
      dateAdded: { type: Date, default: Date.now },
    },
    { collection: 'entities' }
);

const individualSchema = new mongoose.Schema(
    {
      individualId: { type: String, required: true, unique: true },
      name: { type: String, required: true },
      status: { type: String, enum: ['active', 'inactive'], default: 'active' },
      dateAdded: { type: Date, default: Date.now },
    },
    { collection: 'individuals' }
);

// Add indexes for faster queries
entitySchema.index({ entityId: 1, name: 1 });
individualSchema.index({ individualId: 1, name: 1 });

// Database connections
const connections = {
  local: null,
  un: null,
};

// Predefined models
let localEntitiesModel;
let localIndividualsModel;
let unEntitiesModel;
let unIndividualsModel;

// Function to create connection
const createConnection = async (dbName) => {
  const config = dbConfig[dbName];
  try {
    const connection = await mongoose.createConnection(config.uri, config.options);

    connection.on('error', (err) => {
      console.error(`Database connection error (${dbName}):`, err);
    });

    connection.on('connected', () => {
      console.log(`Connected to ${dbName} database`);
    });

    connection.on('disconnected', () => {
      console.log(`Disconnected from ${dbName} database`);
    });

    // Wait for the connection to be fully established
    await new Promise((resolve) => {
      if (connection.readyState === 1) resolve();
      else connection.once('connected', resolve);
    });

    return connection;
  } catch (error) {
    console.error(`Failed to connect to ${dbName} database:`, error);
    throw error;
  }
};

// Initialize connections with retry logic
const initializeConnections = async (retries = 3, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      connections.local = await createConnection('local');
      connections.un = await createConnection('un');

      // Define models for Local database
      localEntitiesModel = connections.local.model('LocalEntities', entitySchema);
      localIndividualsModel = connections.local.model('LocalIndividuals', individualSchema);

      // Define models for UN database
      unEntitiesModel = connections.un.model('UNEntities', entitySchema);
      unIndividualsModel = connections.un.model('UNIndividuals', individualSchema);

      console.log('Database connections initialized successfully');
      return true;
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error.message);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error('Max retries reached. Failed to initialize connections.');
        return false;
      }
    }
  }
};

// Connection state checker
mongoose.Connection.prototype.isConnected = function () {
  return this.readyState === 1;
};

// Functions to get the pre-defined models
const getLocalEntitiesModel = () => {
  if (!localEntitiesModel) throw new Error('Local entities model not initialized');
  return localEntitiesModel;
};

const getLocalIndividualsModel = () => {
  if (!localIndividualsModel) throw new Error('Local individuals model not initialized');
  return localIndividualsModel;
};

const getUNEntitiesModel = () => {
  if (!unEntitiesModel) throw new Error('UN entities model not initialized');
  return unEntitiesModel;
};

const getUNIndividualsModel = () => {
  if (!unIndividualsModel) throw new Error('UN individuals model not initialized');
  return unIndividualsModel;
};

export {
  connections,
  getLocalEntitiesModel,
  getLocalIndividualsModel,
  getUNEntitiesModel,
  getUNIndividualsModel,
  initializeConnections,
};