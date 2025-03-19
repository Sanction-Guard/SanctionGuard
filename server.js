import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { connectDB } from './src/config/database.js';
import { connectDBLocal } from './src/config/db.js';
import { connectDBuser } from './src/config/dataB.js';
import { startScheduler } from './src/services/schedulerServices.js';
import { logger } from './src/utils/logger.js';
import searchRoutes from './src/routes/searchRoutes.js'; // 👈 Use import
import auditRoutes from './src/routes/auditRoutes.js'; // 👈 Use import
import dotenv from 'dotenv';
import dataSourceRoutes from './src/routes/dataSourceRoutes.js'; // From settings page
import { 
  connections, 
  getLocalEntitiesModel, 
  getLocalIndividualsModel, 
  getUNEntitiesModel, 
  getUNIndividualsModel, 
  initializeConnections 
} from './src/utils/dbConnections.js'; // From settings page

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
        // Connect to MongoDB
        await connectDB();
        await connectDBLocal();
        await connectDBuser();
        await initializeConnections(); // Settings page DBs (LocalSanction, UNSanction)

        // Debug connection states
        console.log('LocalSanction connected:', connections.local?.isConnected(), 'readyState:', connections.local?.readyState);
        console.log('UNSanction connected:', connections.un?.isConnected(), 'readyState:', connections.un?.readyState);

        if (!connections.local?.isConnected() || !connections.un?.isConnected()) {
            throw new Error('Failed to connect to LocalSanction or UNSanction databases');
        }

        // Start the scheduler
        startScheduler();

        // Import and use the PDF route
        const pdfRoute = (await import('./src/routes/pdfRoute.js')).default;
        app.use('/api/pdf', pdfRoute);


        app.use('/api/search', searchRoutes);
        app.use('/api', auditRoutes);
        app.use('/api/settings', dataSourceRoutes); // Settings functionality

        // Start the Express server
        const PORT = process.env.PORT || 3001;
        app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
    } catch (error) {
        logger.error('Application error:', error);
        process.exit(1);
    }
}

main();