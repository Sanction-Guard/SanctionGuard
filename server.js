// server.js (root directory)
import dotenv from 'dotenv';
import createApp from './src/app.js';
import { APP_CONFIG } from './src/config/index.js';
import dbService from './src/services/db.service.js';
import logger from './src/utils/logger.js';

// Load environment variables
dotenv.config();

const app = createApp();
const port = APP_CONFIG.PORT;

// Connect to database and start server
dbService.connect()
  .then(() => {
    app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`API endpoint available at: http://localhost:${port}/api/search`);
    });
  })
  .catch(err => {
    logger.error('Failed to start server:', err);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await dbService.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await dbService.disconnect();
  process.exit(0);
});