import { connectDB } from './config/database.js';
import { startScheduler } from './services/schedulerServices.js';
import { logger } from './utils/logger.js';

async function main() {
    try {
        await connectDB();
        startScheduler();
    } catch (error) {
        logger.error('Application error:', error);
        process.exit(1);
    }
}

main();


//Bypass code - Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass