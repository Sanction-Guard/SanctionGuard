import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { connectDB } from './src/config/database.js';
import { userDB } from './src/config/userDB.js';
import { connectDBLocal } from './src/config/db.js';
import { connectDBuser } from './src/config/dataB.js';
import { connectBlocklistDB } from './src/config/blocklistDB.js';
import { startScheduler } from './src/services/schedulerServices.js';
import { logger } from './src/utils/logger.js';
import searchRoutes from './src/routes/searchRoutes.js';
import auditRoutes from './src/routes/auditRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import importRoutes from './src/routes/importRoutes.js';
import dataSourceRoutes from './src/routes/dataSourceRoutes.js';
import dotenv from 'dotenv';
import { 
  connections, 
  getLocalEntitiesModel, 
  getLocalIndividualsModel, 
  getUNEntitiesModel, 
  getUNIndividualsModel, 
  initializeConnections 
} from './src/utils/dbConnections.js';

// Load environment variables
dotenv.config();

// Convert the module URL to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

app.use((err, req, res, next) => {
    console.error(err.stack);
    logger.error('Server error:', err);
    res.status(500).json({ 
      graceful: false,
      message: 'Something went wrong!' 
    });
});

async function main() {
    try {
        // Connect to MongoDB databases
        await connectDB();
        await connectDBLocal();
        await connectDBuser();
        await connectBlocklistDB(); // Connect to BlockList database
        await initializeConnections(); // Settings page DBs (LocalSanction, UNSanction)

        // Debug connection states
        console.log('LocalSanction connected:', connections.local?.isConnected(), 'readyState:', connections.local?.readyState);
        console.log('UNSanction connected:', connections.un?.isConnected(), 'readyState:', connections.un?.readyState);

        if (!connections.local?.isConnected() || !connections.un?.isConnected()) {
            throw new Error('Failed to connect to LocalSanction or UNSanction databases');
        }

        // Wait for userDB connection if not already established
        if (userDB.readyState !== 1) {
          await new Promise((resolve) => userDB.once('open', resolve));
        }
        console.log('User database connection established');
        
        logger.info('All database connections established successfully');

        // Start the scheduler
        startScheduler();

        // Import and use the PDF route
        const pdfRoute = (await import('./src/routes/pdfRoute.js')).default;
        app.use('/api/pdf', pdfRoute);
        
        // Define all routes
        app.use('/api/imports', importRoutes);
        app.use('/api/search', searchRoutes);
        app.use('/api', auditRoutes);
        app.use('/api/settings', dataSourceRoutes);
        app.use('/api/auth', authRoutes);

        // API status endpoint
        app.get('/api/status', (req, res) => {
            res.json({ 
                status: 'API is running', 
                timestamp: new Date(),
                version: '1.3.0',  // Increment version to reflect merged functionality
                databases: {
                    un: 'connected',
                    local: 'connected',
                    user: 'connected',
                    blocklist: 'connected',
                    localSanction: connections.local?.isConnected() ? 'connected' : 'disconnected',
                    unSanction: connections.un?.isConnected() ? 'connected' : 'disconnected'
                }
            });
        });

        // Start the Express server
        const PORT = process.env.PORT || 3001;
        app.listen(PORT, () => {
            logger.info(`🚀 Server running on http://localhost:${PORT}`);
            logger.info('Data import feature is now available at /api/imports/upload');
            logger.info('Settings and data source management available at /api/settings');
            logger.info('Auth functionality available at /api/auth');
        });
    } catch (error) {
        logger.error('Application error:', error);
        process.exit(1);
    }
}

main();