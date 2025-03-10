const express = require('express');
const { searchSanctions, getDatabaseStatus } = require('../controllers/searchController');
const router = express.Router();

router.post('/search', searchSanctions);
router.get('/database-status', getDatabaseStatus);

module.exports = router;
