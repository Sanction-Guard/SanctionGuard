import dbService from './db.service.js';
import { buildSearchQueries } from '../utils/query-builder.js';
import logger from '../utils/logger.js';

export const searchService = {
  async searchSanctionLists(fullName) {
    try {
      await dbService.connect();
      
      // Parse name parts
      const nameParts = fullName.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const secondName = nameParts[1] || '';
      const thirdName = nameParts.slice(2).join(' ') || '';
      
      logger.info(`Searching for: firstName=${firstName}, secondName=${secondName}, thirdName=${thirdName}`);
      
      // Build queries
      const { individualQuery, entityQuery } = buildSearchQueries(fullName, nameParts, firstName, secondName, thirdName);
      
      // Get collection references
      const collections = {
        unSanction: {
          individuals: dbService.getCollection('UNSanction', 'individuals'),
          entities: dbService.getCollection('UNSanction', 'entities')
        },
        localSanction: {
          individuals: dbService.getCollection('LocalSanction', 'individuals'),
          entities: dbService.getCollection('LocalSanction', 'entities')
        }
      };
      
      // Execute queries
      const [
        unSanctionIndividuals,
        unSanctionEntities,
        localSanctionIndividuals,
        localSanctionEntities
      ] = await Promise.all([
        collections.unSanction.individuals.find(individualQuery).toArray(),
        collections.unSanction.entities.find(entityQuery).toArray(),
        collections.localSanction.individuals.find(individualQuery).toArray(),
        collections.localSanction.entities.find(entityQuery).toArray()
      ]);
      
      // Log results
      this._logSearchResults(unSanctionIndividuals, unSanctionEntities, localSanctionIndividuals, localSanctionEntities);
      
      // Prepare and return results
      return {
        unSanction: {
          individuals: unSanctionIndividuals,
          entities: unSanctionEntities
        },
        localSanction: {
          individuals: localSanctionIndividuals,
          entities: localSanctionEntities
        },
        summary: {
          totalIndividuals: unSanctionIndividuals.length + localSanctionIndividuals.length,
          totalEntities: unSanctionEntities.length + localSanctionEntities.length,
          total: unSanctionIndividuals.length + unSanctionEntities.length + 
                 localSanctionIndividuals.length + localSanctionEntities.length
        },
        searchInfo: {
          fullName,
          nameParts: {
            firstName,
            secondName,
            thirdName
          }
        }
      };
    } catch (error) {
      logger.error('Error in searchSanctionLists:', error);
      throw error;
    }
  },
  
  _logSearchResults(unSanctionIndividuals, unSanctionEntities, localSanctionIndividuals, localSanctionEntities) {
    // Log UNSanction results
    logger.info('\nResults from UNSanction database:');
    logger.info(`Individuals: ${unSanctionIndividuals.length} found`);
    unSanctionIndividuals.forEach((doc, index) => {
      logger.debug(`Individual ${index + 1}:`, doc);
    });
    
    logger.info(`Entities: ${unSanctionEntities.length} found`);
    unSanctionEntities.forEach((doc, index) => {
      logger.debug(`Entity ${index + 1}:`, doc);
    });
    
    // Log LocalSanction results
    logger.info('\nResults from LocalSanction database:');
    logger.info(`Individuals: ${localSanctionIndividuals.length} found`);
    localSanctionIndividuals.forEach((doc, index) => {
      logger.debug(`Individual ${index + 1}:`, doc);
    });
    
    logger.info(`Entities: ${localSanctionEntities.length} found`);
    localSanctionEntities.forEach((doc, index) => {
      logger.debug(`Entity ${index + 1}:`, doc);
    });
  }
};