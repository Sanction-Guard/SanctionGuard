const express = require('express');
const searchController = require('../controllers/searchController');

const router = express.Router();

router.post('/search', searchController.search);
router.get('/status', searchController.getDatabaseStatus);

module.exports = router;
