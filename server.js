// dotenv.config();
// import express from 'express';
// import dotenv from 'dotenv';
// import path from 'path';
// import { fileURLToPath } from 'url';
// import { connectDB } from './src/config/database.js';
// import { connectDBLocal } from './src/config/db.js';
// import { startScheduler } from './src/services/schedulerServices.js';
// import { logger } from './src/utils/logger.js';
// import searchRoutes from './src/routes/searchRoutes.js'; // 👈 Use import
// import AuditLog from './src/models/AuditLog.js'; // 👈 Use import
// import cors from 'cors';



// console.log('Elasticsearch URL:', process.env.ELASTICSEARCH_URL);
// console.log('Elasticsearch Index:', process.env.ELASTICSEARCH_INDEX);
// console.log('MongoDB URI:', process.env.MONGODB_URI);

// const app = express();
// const PORT = process.env.PORT || 3001;

// // Middleware
// app.use(cors());
// app.use(express.json());
// app.use('/api/search', searchRoutes);


// async function main() {
//     try {
//         // Connect to MongoDB
//         await connectDB();
//         await connectDBLocal();
       

// // Connect to MongoDB
// mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//     .then(() => console.log('Connected to MongoDB'))
//     .catch((err) => console.error('MongoDB connection error:', err));

// // Start server
// app.listen(PORT, () => {
//     console.log(`Server running on port ${PORT}`);
// });


import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './src/config/database.js';
import { connectDBLocal } from './src/config/db.js';
import { startScheduler } from './src/services/schedulerServices.js';
import { logger } from './src/utils/logger.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Convert the module URL to a file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

async function main() {
    try {
        // Connect to MongoDB
        //await connectDB();
        await connectDBLocal();

        // Start the scheduler
        startScheduler();

        // Import and use the PDF route
        const pdfRoute = (await import('./src/routes/pdfRoute.js')).default;
        app.use('/api/pdf', pdfRoute);

        // Start the Express server
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
    } catch (error) {
        logger.error('Application error:', error);
        process.exit(1);
    }
}

main();