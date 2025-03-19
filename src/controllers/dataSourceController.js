// controllers/dataSourceController.js
import { 
    connections, 
    getLocalEntitiesModel, 
    getLocalIndividualsModel, 
    getUNEntitiesModel, 
    getUNIndividualsModel, 
    initializeConnections 
  } from '../utils/dbConnections.js';
  
  let currentDataSource = 'Local';
  
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
  
  // Set data source
  const setDataSource = async (req, res) => {
    const { dataSource } = req.body;
  
    if (!dataSource || !['Local', 'UN', 'Both'].includes(dataSource)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid data source selection' 
      });
    }
  
    try {
      // Check if connections are alive
      if (!connections.local?.isConnected() || !connections.un?.isConnected()) {
        await initializeConnections();
      }
  
      // Verify connections after attempted initialization
      if (!connections.local?.isConnected() || !connections.un?.isConnected()) {
          throw new Error('Failed to establish database connections');
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
  
  // Get data based on current data source
  const getData = async (req, res) => {
    try {
      let results = {};
  
      switch (currentDataSource) {
        case 'Local':
          const LocalEntities = getLocalEntitiesModel();
          const LocalIndividuals = getLocalIndividualsModel();
          results.entities = await LocalEntities.find().limit(10);
          results.individuals = await LocalIndividuals.find().limit(10);
          break;
        
        case 'UN':
          const UNEntities = getUNEntitiesModel();
          const UNIndividuals = getUNIndividualsModel();
          results.entities = await UNEntities.find().limit(10);
          results.individuals = await UNIndividuals.find().limit(10);
          break;
        
        case 'Both':
          const LocalEnt = getLocalEntitiesModel();
          const LocalInd = getLocalIndividualsModel();
          const UNEnt = getUNEntitiesModel();
          const UNInd = getUNIndividualsModel();
          results.local = {
            entities: await LocalEnt.find().limit(10),
            individuals: await LocalInd.find().limit(10)
          };
          results.un = {
            entities: await UNEnt.find().limit(10),
            individuals: await UNInd.find().limit(10)
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
