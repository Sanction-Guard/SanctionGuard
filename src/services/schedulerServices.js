import cron from 'node-cron';
import { CRON_SCHEDULE } from '../config/constants.js';
import { runScheduledTask } from '../controllers/sanctionController.js';
import { logger } from '../utils/logger.js';

export const startScheduler = () => {
    logger.info('Starting scheduler...');
    
    cron.schedule(CRON_SCHEDULE, async () => {
        logger.info('Running scheduled task...');
        await runScheduledTask();
    });
    
    // Run immediately on startup
    runScheduledTask();
};