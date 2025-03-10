const { searchElasticsearch, fetchDatabaseStatus } = require('../services/searchService');

exports.searchSanctions = async (req, res) => {
    try {
        const { searchTerm } = req.body;
        if (!searchTerm) {
            return res.status(400).json({ error: 'Search term is required' });
        }
        const results = await searchElasticsearch(searchTerm);
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};

// Controller function to fetch database status
exports.getDatabaseStatus = async (req, res) => {
    try {
        const status = await fetchDatabaseStatus();
        res.json(status);
    } catch (error) {
        res.status(500).json({ error: 'Server error', details: error.message });
    }
};