// routes/dataSourceRoutes.js
import express from 'express';
import { 
  getDataSource, 
  setDataSource, 
  getData 
} from '../controllers/dataSourceController.js';

const router = express.Router();

// Routes
router.get('/data-source', getDataSource);
router.post('/data-source', setDataSource);
router.get('/data', getData);

export default router;