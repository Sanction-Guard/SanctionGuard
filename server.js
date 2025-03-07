import { connectDB } from '../SanctionGuard/src/config/database.js';
import { startScheduler } from '../SanctionGuard/src/services/schedulerServices.js';
import { logger } from '../SanctionGuard/src/utils/logger.js';

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