// // // src/app.js
// // import express from 'express';
// // import cors from 'cors';
// // import { APP_CONFIG } from './config/app.config.js';
// // import apiRoutes from './routes/index.js';
// // import { errorHandler, notFoundHandler } from './middleware/index.js';
// // import logger from './utils/logger.js';

// // const app = express();

// // const createApp = () => {
// //   const app = express();
  
// //   // Middleware
// //   app.use(cors(APP_CONFIG.CORS_OPTIONS));
// //   app.use(express.json());
  
// //   // Routes - Important: mount at /api prefix
// //   app.use('/api', apiRoutes);
  
// //   // Basic root route for testing
// //   app.get('/', (req, res) => {
// //     res.json({ message: 'SanctionGuard API is running' });
// //   });
  
// //   // Error handling
// //   app.use(notFoundHandler);
// //   app.use(errorHandler);
  
// //   return app;
// // };

// // app.use(cors({
// //     origin: '*',
// //     methods: ['GET', 'POST', 'PUT', 'DELETE'],
// //     allowedHeaders: ['Content-Type', 'Authorization']
// //   }));

// // export default createApp;


// // src/app.js - CRITICAL PART
// import express from 'express';
// import cors from 'cors';
// import { searchController } from './controllers/search.controllers.js';
// import { errorHandler, notFoundHandler } from './middleware/index.js';
// import logger from './utils/logger.js';

// const createApp = () => {
//   const app = express();
  
//   // Middleware
//   app.use(cors());
//   app.use(express.json());
  
//   // Define routes directly in app.js for debugging
//   app.post('/api/search', searchController.search);
  
//   // Add a test endpoint
//   app.get('/test', (req, res) => {
//     res.json({ message: 'Test endpoint is working!' });
//   });
  
//   // Root endpoint
//   app.get('/', (req, res) => {
//     res.json({ message: 'SanctionGuard API is running. Use POST /api/search to search.' });
//   });
  
//   // Error handling
//   app.use(notFoundHandler);
//   app.use(errorHandler);
  
//   return app;
// };

// export default createApp;

import express from 'express';
import cors from 'cors';
import { searchController } from './controllers/search.controllers.js';
import { errorHandler, notFoundHandler } from './middleware/index.js';
import logger from './utils/logger.js';

const createApp = () => {
  const app = express();
  
  // Middleware
  app.use(cors());
  app.use(express.json());
  
  // Define routes directly in app.js for debugging
  app.post('/api/search', searchController.search);
  
  // Add a test endpoint
  app.get('/test', (req, res) => {
    res.json({ message: 'Test endpoint is working!' });
  });
  
  // Root endpoint
  app.get('/', (req, res) => {
    res.json({ message: 'SanctionGuard API is running. Use POST /api/search to search.' });
  });
  
  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);
  
  return app;
};

export default createApp;