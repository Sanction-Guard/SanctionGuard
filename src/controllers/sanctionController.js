import cron from 'node-cron';
import { fetchAndParseXML, processIndividuals, processEntities } from '../services/xmlServices.js';
import { connectDB } from '../config/database.js';

function logWithTimestamp(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

export function startScheduler() {
    logWithTimestamp('Starting scheduler...');

    cron.schedule('0 */15 * * *', async () => {
        logWithTimestamp('Running scheduled task...');
        await runScheduledTask();
    });

    runScheduledTask();
}

export const runScheduledTask = async() => {
    try {
        await connectDB();
        const result = await fetchAndParseXML();
        await processIndividuals(result);
        await processEntities(result);
        logWithTimestamp('Scheduled sync completed');
    } catch (error) {
        logWithTimestamp(`Scheduled task error: ${error.message}`);
    }
}
