import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { connectDB } from './src/config/database.js';
import { connectDBLocal } from './src/config/db.js';
import { connectDBuser } from './src/config/dataB.js';
import { connectBlocklistDB } from './src/config/blocklistDB.js';
import { startScheduler } from './src/services/schedulerServices.js';
import { logger } from './src/utils/logger.js';
import searchRoutes from './src/routes/searchRoutes.js';
import auditRoutes from './src/routes/auditRoutes.js';
import importRoutes from './src/routes/importRoutes.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Convert the module URL to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors());

async function main() {
    try {
        // Connect to MongoDB databases
        await connectDB();
        await connectDBLocal();
        await connectDBuser();
        await connectBlocklistDB(); // Connect to new BlockList database
        
        logger.info('All database connections established successfully');

        // Start the scheduler
        startScheduler();

        // Import and use the PDF route
        const pdfRoute = (await import('./src/routes/pdfRoute.js')).default;
        app.use('/api/pdf', pdfRoute);
        
        // Use the new imports route
        app.use('/api/imports', importRoutes);
        
        // Use existing routes
        app.use('/api/search', searchRoutes);
        app.use('/api', auditRoutes);

        // API status endpoint
        app.get('/api/status', (req, res) => {
            res.json({ 
                status: 'API is running', 
                timestamp: new Date(),
                version: '1.2.0',  // Increment version to reflect BlockList integration
                databases: {
                    un: 'connected',
                    local: 'connected',
                    user: 'connected',
                    blocklist: 'connected'
                }
            });
        });

        // Start the Express server
        const PORT = process.env.PORT || 3001;
        app.listen(PORT, () => {
            logger.info(`🚀 Server running on http://localhost:${PORT}`);
            logger.info('Data import feature is now available at /api/imports/upload');
            logger.info('Imported data will be stored in the BlockList database');
        });
    } catch (error) {
        logger.error('Application error:', error);
        process.exit(1);
    }
}

main();