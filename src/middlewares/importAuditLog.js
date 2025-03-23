// src/middlewares/importAuditLog.js
import BlockListAuditLog from '../models/BlockListAuditLog.js';
import mongoose from "mongoose";
import { logger } from '../utils/logger.js';

/**
 * Middleware to log import activities to the BlockList database
 */
const importAuditLogMiddleware = async (req, res, next) => {
    try {
        const userId = req.user?.userId || new mongoose.Types.ObjectId();
        const action = 'Import';
        const searchTerm = 'File Import';
        const searchType = 'import';

        // Log the action
        const logEntry = new BlockListAuditLog({
            userId,
            action,
            searchTerm,
            searchType,
            results: [], // Will be updated after the action is complete
        });

        await logEntry.save();
        logger.info(`Created audit log entry for import in BlockList database`);

        // Attach the log entry to the request for later use
        req.auditLog = logEntry;

        next();
    } catch (error) {
        logger.error('Error in importAuditLogMiddleware:', error);
        // Continue to the next middleware even if logging fails
        next();
    }
};

export default importAuditLogMiddleware;
