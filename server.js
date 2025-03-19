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
        // Connect to MongoDB
        await connectDB();
        await connectDBLocal();
        await connectDBuser();

        // Start the scheduler
        startScheduler();

        // Import and use the PDF route
        const pdfRoute = (await import('./src/routes/pdfRoute.js')).default;
        app.use('/api/pdf', pdfRoute);


        app.use('/api/search', searchRoutes);
        app.use('/api', auditRoutes);

        // Start the Express server
        const PORT = process.env.PORT || 3001;
        app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
    } catch (error) {
        logger.error('Application error:', error);
        process.exit(1);
    }
}

main();