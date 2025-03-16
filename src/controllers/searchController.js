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

export default { search, getDatabaseStatus }; // 👈 Use export