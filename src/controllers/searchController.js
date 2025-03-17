import AuditLog from '../models/AuditLog.js'; // 👈 Use import
import searchService from '../services/searchService.js';
import mongoose from "mongoose"; // 👈 Use import

const search = async (req, res) => {
    const { searchTerm, searchType } = req.body;
    const userId = req.user?.userId || new mongoose.Types.ObjectId();

    try {
        const results = await searchService.performSearch(searchTerm, searchType);

        if (req.auditLog) {
            req.auditLog.results = results; // Update the results
            await req.auditLog.save(); // Save the updated audit log
        } else {
            // If req.auditLog doesn't exist, create a new one
            const newAuditLog = new AuditLog({
                userId: userId,
                action: 'Search', // Specify the action name
                searchTerm: searchTerm,
                searchType: searchType,
                results: results,
            });

            await newAuditLog.save(); // Save the new audit log
        }

        res.json(results);
    } catch (error) {
        console.error('Error in search controller:', error);
        res.status(500).json({ error: error.message || 'An error occurred during the search' });
    }
};

const getDatabaseStatus = async (req, res) => {
    try {
        const status = await searchService.getDatabaseStatus();
        res.json(status);
    } catch (error) {
        console.error('Error in getDatabaseStatus controller:', error);
        res.status(500).json({ error: error.message || 'An error occurred while fetching database status' });
    }
};

const getAuditLogs = async (req, res) => {
    try {
        const { userId, searchTerm, searchType, action } = req.query;

        // Create a filter object based on provided query parameters
        let filter = {};
        if (userId) filter.userId = userId;
        if (searchTerm) filter.searchTerm = { $regex: searchTerm, $options: "i" }; // Case-insensitive search
        if (searchType) filter.searchType = searchType;
        if (action) filter.action = action;

        // Fetch filtered audit logs from the database
        const auditLogs = await AuditLog.find(filter).sort({ createdAt: -1 });

        res.json(auditLogs);
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        res.status(500).json({ error: error.message || "An error occurred while retrieving audit logs" });
    }
};


export default { search, getDatabaseStatus, getAuditLogs };