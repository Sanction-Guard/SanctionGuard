export const logger = {
    info: (message) => {
        const timestamp = new Date().toISOString();
        console.log(`[INFO] ${timestamp}: ${message}`);
    },
    error: (message, error) => {
        const timestamp = new Date().toISOString();
        console.error(`[ERROR] ${timestamp}: ${message}`, error);
    }
};