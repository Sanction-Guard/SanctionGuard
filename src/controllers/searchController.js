const searchService = require('../services/searchService');

const search = async (req, res) => {
    const { searchTerm, searchType } = req.body;
  
    try {
      const results = await searchService.performSearch(searchTerm, searchType);
      res.json(results);
    } catch (error) {
      console.error('Error in search controller:', error);
      res.status(500).json({ error: error.message || 'An error occurred during the search' });
    }
  };
  
  const getDatabaseStatus = async (req, res) => {
    try {
      const status = await searchService.getDatabaseStatus();
      res.json(status);
    } catch (error) {
      console.error('Error in getDatabaseStatus controller:', error);
      res.status(500).json({ error: error.message || 'An error occurred while fetching database status' });
    }
  };

module.exports = {
  search,
  getDatabaseStatus,
};