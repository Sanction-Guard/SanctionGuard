// // import express from 'express';
// // import { searchController } from '../controllers/search.controllers.js';

// // const router = express.Router();

// // // Define the search route
// // router.post('/search', searchController.search);

// // export default router;

// import express from 'express';
// import { searchController } from '../controllers/search.controller.js';

// const router = express.Router();

// // This will be accessible at /api/search
// router.post('/search', searchController.search);

// export default router;


import express from 'express';
import { searchController } from '../controllers/search.controller.js';

const router = express.Router();

// This will be accessible at /api/search
router.post('/search', searchController.search);

export default router;