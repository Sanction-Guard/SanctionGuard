// import { searchService } from '../services/search.service.js';
// import { formatResponse } from '../utils/response.js';
// import logger from '../utils/logger.js';

// export const searchController = {
//   async search(req, res) {
//     try {
//       const { fullName } = req.body;
      
//       if (!fullName || fullName.trim() === '') {
//         return res.status(400).json(
//           formatResponse.error('Search name is required', 400)
//         );
//       }
      
//       const searchResults = await searchService.searchSanctionLists(fullName);
      
//       return res.json(formatResponse.success({
//         ...searchResults
//       }));
      
//     } catch (error) {
//       logger.error('Error in search controller:', error);
//       return res.status(500).json(
//         formatResponse.error('Error querying databases', 500, error)
//       );
//     }
//   }
// };

// import { searchService } from '../services/search.service.js';
// import logger from '../utils/logger.js';

// export const searchController = {
//   async search(req, res) {
//     try {
//       logger.info('Search request received:', req.body);
      
//       const { fullName } = req.body;
      
//       if (!fullName || fullName.trim() === '') {
//         logger.info('Invalid search request - missing name');
//         return res.status(400).json({
//           success: false,
//           error: 'Search name is required'
//         });
//       }
      
//       logger.info(`Processing search for: ${fullName}`);
      
//       // For debugging - immediately return a success response
//       return res.json({
//         success: true,
//         message: 'Search endpoint is working!',
//         requestData: { fullName }
//       });
      
//       // Comment out actual search to test endpoint first
//       /*
//       const searchResults = await searchService.searchSanctionLists(fullName);
      
//       return res.json({
//         success: true,
//         data: searchResults
//       });
//       */
//     } catch (error) {
//       logger.error('Error in search controller:', error);
//       return res.status(500).json({
//         success: false,
//         error: 'Error querying databases'
//       });
//     }
//   }
// };


// import { searchService } from '../services/search.service.js';
// import logger from '../utils/logger.js';

// export const searchController = {
//   async search(req, res) {
//     try {
//       logger.info('Search request received:', req.body);
      
//       // Extract fullName from request body
//       const { fullName } = req.body;
      
//       // Validate the input
//       if (!fullName || fullName.trim() === '') {
//         logger.info('Invalid search request - missing name');
//         return res.status(400).json({
//           success: false,
//           error: 'Search name is required'
//         });
//       }
      
//       logger.info(`Processing search for: ${fullName}`);
      
//       // Perform the actual search
//       const searchResults = await searchService.searchSanctionLists(fullName);
      
//       // Return search results to the frontend
//       return res.json({
//         success: true,
//         data: searchResults
//       });
//     } catch (error) {
//       logger.error('Error in search controller:', error);
//       return res.status(500).json({
//         success: false,
//         error: 'Error querying databases'
//       });
//     }
//   }
// };

import { searchService } from '../services/search.service.js';
import logger from '../utils/logger.js';

export const searchController = {
  async search(req, res) {
    try {
      logger.info('Search request received:', req.body);
      
      // Extract fullName from request body
      const { fullName } = req.body;
      
      // Validate the input
      if (!fullName || fullName.trim() === '') {
        logger.info('Invalid search request - missing name');
        return res.status(400).json({
          success: false,
          error: 'Search name is required'
        });
      }
      
      logger.info(`Processing search for: ${fullName}`);
      
      // Perform the actual search
      const searchResults = await searchService.searchSanctionLists(fullName);
      
      // Return search results to the frontend
      return res.json({
        success: true,
        data: searchResults
      });
    } catch (error) {
      logger.error('Error in search controller:', error);
      return res.status(500).json({
        success: false,
        error: 'Error querying databases'
      });
    }
  }
};