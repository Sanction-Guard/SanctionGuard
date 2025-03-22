import {
  connections,
  getLocalEntitiesModel,
  getLocalIndividualsModel,
  getUNEntitiesModel,
  getUNIndividualsModel,
  initializeConnections
} from '../utils/dbConnections.js';

let currentDataSource = 'Local';
let modelCache = {
  local: null,
  un: null
};

// Get current data source
const getDataSource = (req, res) => {
  res.json({
    dataSource: currentDataSource,
    connections: {
      local: !!connections.local?.isConnected(),
      un: !!connections.un?.isConnected()
    }
  });
};

// Set data source and cache models
const setDataSource = async (req, res) => {
  const { dataSource } = req.body;

  if (!dataSource || !['Local', 'UN', 'Both'].includes(dataSource)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid data source selection'
    });
  }

  try {
    // Check and maintain connections
    if (!connections.local?.isConnected() || !connections.un?.isConnected()) {
      await initializeConnections();
    }

    if (!connections.local?.isConnected() || !connections.un?.isConnected()) {
      throw new Error('Failed to establish database connections');
    }

    // Cache models when switching data sources
    if (dataSource === 'Local' || dataSource === 'Both') {
      modelCache.local = {
        entities: getLocalEntitiesModel(),
        individuals: getLocalIndividualsModel()
      };
    }

    if (dataSource === 'UN' || dataSource === 'Both') {
      modelCache.un = {
        entities: getUNEntitiesModel(),
        individuals: getUNIndividualsModel()
      };
    }

    currentDataSource = dataSource;

    res.json({
      success: true,
      message: `Data source set to ${dataSource}`,
      dataSource: currentDataSource
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating data source',
      error: error.message
    });
  }
};

// Get data using cached models
const getData = async (req, res) => {
  try {
    let results = {};

    switch (currentDataSource) {
      case 'Local':
        results = {
          entities: await modelCache.local.entities.find().limit(10),
          individuals: await modelCache.local.individuals.find().limit(10)
        };
        break;

      case 'UN':
        results = {
          entities: await modelCache.un.entities.find().limit(10),
          individuals: await modelCache.un.individuals.find().limit(10)
        };
        break;

      case 'Both':
        results = {
          local: {
            entities: await modelCache.local.entities.find().limit(10),
            individuals: await modelCache.local.individuals.find().limit(10)
          },
          un: {
            entities: await modelCache.un.entities.find().limit(10),
            individuals: await modelCache.un.individuals.find().limit(10)
          }
        };
        break;
    }

    res.json({
      success: true,
      data: results,
      dataSource: currentDataSource
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching data',
      error: error.message
    });
  }
};

export {
  getDataSource,
  setDataSource,
  getData
};