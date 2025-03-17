// routes/dataSourceRoutes.js
const express = require('express');
const router = express.Router();
const { 
  getDataSource, 
  setDataSource, 
  getData 
} = require('../controllers/dataSourceController');

// Routes
router.get('/data-source', getDataSource);
router.post('/data-source', setDataSource);
router.get('/data', getData);

module.exports = router;