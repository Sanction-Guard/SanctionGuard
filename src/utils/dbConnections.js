// models/dbConnections.js
import mongoose from 'mongoose';

// Database configuration
const dbConfig = {
  local: {
    uri: process.env.MONGODB_URI_local,
    options: {}
  },
  un: {
    uri: process.env.UN_MONGODB_URI,
    options: {}
  }
};

// Schemas
const entitySchema = new mongoose.Schema({
  // Example fields - replace with your actual schema
  entityId: String,
  name: String,
  status: String,
  dateAdded: Date
}, { collection: 'entities' }); // Explicitly use 'entities' collection

const individualSchema = new mongoose.Schema({
  // Example fields - replace with your actual schema
  individualId: String,
  name: String,
  status: String,
  dateAdded: Date
}, { collection: 'individuals' }); // Explicitly use 'individuals' collection


// Database connections
const connections = {
  local: null,
  un: null
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

// Initialize connections
const initializeConnections = async () => {
  try {
    connections.local = await createConnection('local');
    connections.un = await createConnection('un');
    
    // Define models for LocalSanction
    localEntitiesModel = connections.local.model('LocalEntities', entitySchema);
    localIndividualsModel = connections.local.model('LocalIndividuals', individualSchema);
    
    // Define models for UNSanction
    unEntitiesModel = connections.un.model('UNEntities', entitySchema);
    unIndividualsModel = connections.un.model('UNIndividuals', individualSchema);
    
    return true;
  } catch (error) {
    console.error('Error initializing connections:', error);
    return false;
  }
};

// Initialize on module load
//initializeConnections();

// Connection state checker
mongoose.Connection.prototype.isConnected = function() {
  return this.readyState === 1;
};

// Functions to get the pre-defined models
const getLocalEntitiesModel = () => localEntitiesModel;
const getLocalIndividualsModel = () => localIndividualsModel;
const getUNEntitiesModel = () => unEntitiesModel;
const getUNIndividualsModel = () => unIndividualsModel;

export { 
  connections, 
  getLocalEntitiesModel, 
  getLocalIndividualsModel, 
  getUNEntitiesModel, 
  getUNIndividualsModel, 
  initializeConnections 
};