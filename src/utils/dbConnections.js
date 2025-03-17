// models/dbConnections.js
import mongoose from 'mongoose';

// Database configuration
const dbConfig = {
  local: {
    uri: process.env.LOCAL_MONGODB_URI,
    options: {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    }
  },
  un: {
    uri: process.env.UN_MONGODB_URI,
    options: {
    //   useNewUrlParser: true,
    //   useUnifiedTopology: true,
    }
  }
};

// Schemas
const localSchema = new mongoose.Schema({
  userId: String,
  data: String,
  timestamp: Date
});

const unSchema = new mongoose.Schema({
  recordId: String,
  name: String,
  status: String,
  dateAdded: Date
});

// Function to get models for each database
const getLocalModel = () => connections.local.model('LocalRecord', localSchema);
const getUNModel = () => connections.un.model('UNRecord', unSchema);

// Database connections
const connections = {
  local: null,
  un: null
};

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
    
    // Define models
    connections.local.model('LocalRecord', localSchema);
    connections.un.model('UNRecord', unSchema);
    
    return true;
  } catch (error) {
    console.error('Error initializing connections:', error);
    return false;
  }
};

// Initialize on module load
initializeConnections();

// Connection state checker
mongoose.Connection.prototype.isConnected = function() {
  return this.readyState === 1;
};

export { connections, getLocalModel, getUNModel, initializeConnections };