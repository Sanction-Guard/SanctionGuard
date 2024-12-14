const express = require('express');
const router = express.Router();

//Official Sanction List Management
router.post('/official', (req, res) => {
    res.status(200).json({ message: 'New official sanction list added!' });
});

router.get('/official', (req, res) => {
    res.status(200).json([
        { id: 1, name: 'OFAC List', addedBy: 'Admin', dateAdded: '2024-12-14' },
        { id: 2, name: 'UN Sanctions', addedBy: 'Admin', dateAdded: '2024-12-13' }
    ]);
});

router.delete('/official/:id', (req, res) => {
    const id = req.params.id;
    res.status(200).json({ message: `Official sanction list with ID ${id} deleted!` });
});

// Blacklist Management (Organizations)
router.post('/blacklist', (req, res) => {
    res.status(200).json({ message: 'New blacklist entry added!' });
});

router.get('/blacklist', (req, res) => {
    res.status(200).json([
        { id: 1, name: 'John Doe', organization: 'Org A', addedDate: '2024-12-14' },
        { id: 2, name: 'Jane Smith', organization: 'Org B', addedDate: '2024-12-13' }
    ]);
});

router.delete('/blacklist/:id', (req, res) => {
    const id = req.params.id;
    res.status(200).json({ message: `Blacklist entry with ID ${id} deleted!` });
});

// Data Comparison
router.post('/compare', (req, res) => {
    const dataToCompare = req.body.data || [];
    res.status(200).json({
        message: 'Comparison complete!',
        matches: [
            { name: 'John Doe', listType: 'Official', listName: 'OFAC List' },
            { name: 'Jane Smith', listType: 'Blacklist', organization: 'Org B' }
        ]
    });
});

// Search Across All Lists
router.get('/search', (req, res) => {
    const query = req.query.q || 'No query provided';
    res.status(200).json({
        message: `Search results for: ${query}`,
        results: [
            { name: 'John Doe', listType: 'Official', listName: 'OFAC List' },
            { name: 'Jane Smith', listType: 'Blacklist', organization: 'Org B' }
        ]
    });
});

module.exports = router;
