import AuditLog from '../models/AuditLog.js';
import mongoose from "mongoose";
const auditLogMiddleware = async (req, res, next) => {
    try {
        const userId = req.user?.userId || new mongoose.Types.ObjectId();  // Assuming user info is stored in req.user
        const { searchTerm, searchType } = req.body;
        const action = req.originalUrl.split('/').pop(); // Extract action from URL (e.g., "search")

        // Log the action
        const logEntry = new AuditLog({
            userId,
            action,
            searchTerm,
            searchType,
            results: [], // Will be updated after the action is complete
        });

        await logEntry.save();

        // Attach the log entry to the request for later use
        req.auditLog = logEntry;

        next();
    } catch (error) {
        console.error('Error in auditLogMiddleware:', error);
        next(error);
    }
};

export default auditLogMiddleware;