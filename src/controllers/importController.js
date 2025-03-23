// src/controllers/importController.js
/**
 * Controller for handling file imports
 * Manages file uploads, import record creation, and processing
 * 
 * @author SanctionGuard Development Team
 * @version 2.0.0
 */

import fs from 'fs';
import path from 'path';
import { processImportCSV } from '../services/importCSVService.js';
import Import from '../models/Import.js';
import BlockListAuditLog from '../models/BlockListAuditLog.js';
import { logger } from '../utils/logger.js';
import importElasticsearchService from '../services/importElasticsearchService.js';

/**
 * Initialize Elasticsearch when the controller is loaded
 * This ensures Elasticsearch is ready to receive indexed data
 */
(async function initElasticsearch() {
    try {
        // Attempt to initialize Elasticsearch connection
        const status = await importElasticsearchService.initializeElasticsearch();
        if (status) {
            logger.info('Elasticsearch initialized successfully for imports');
        } else {
            logger.warn('Elasticsearch initialization failed - import indexing may not work');
        }
    } catch (error) {
        logger.error('Error initializing Elasticsearch for imports:', error);
    }
})();

/**
 * Upload and process CSV files
 * This controller handles file uploads, validates file types, and schedules CSV processing
 * 
 * @async
 * @param {Object} req - Express request object containing uploaded files
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with status and import details
 */
export const uploadFiles = async (req, res) => {
    // Validate that files were uploaded
    if (!req.files || req.files.length === 0) {
        // Return 400 Bad Request if no files were provided
        return res.status(400).json({ error: 'No files uploaded' });
    }
    
    // Array to store import records
    const imports = [];
    
    try {
        // Check if any files are not CSV
        const nonCsvFiles = req.files.filter(file => {
            const fileExtension = path.extname(file.originalname).toLowerCase();
            return fileExtension !== '.csv';
        });
        
        // Return error if any non-CSV files found
        if (nonCsvFiles.length > 0) {
            // Return 400 Bad Request for invalid file types
            return res.status(400).json({ 
                error: 'Only CSV files are supported at this time' 
            });
        }
        
        // Check for duplicate files before processing
        for (const file of req.files) {
            try {
                // Check if the file has been previously imported by filename
                const existingImport = await Import.findOne({ 
                    filename: file.originalname,
                });
                
                if (existingImport) {
                    // Return 409 Conflict for duplicate files
                    return res.status(409).json({ 
                        error: `Duplicate file detected: "${file.originalname}" has already been imported`
                    });
                }
            } catch (dbError) {
                // Log the error but continue processing
                logger.error('Database error checking duplicates:', dbError);
                // Continue processing even if duplicate check fails
            }
        }
        
        // Process each uploaded file
        for (const file of req.files) {
            // Get file extension without the leading dot
            const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
            
            // Create import record to track the process
            const newImport = new Import({
                filename: file.originalname,
                fileType: 'csv', // We're only supporting CSV
                fileSize: file.size,
                status: 'pending' // Initial status
            });
            
            // Save the import record to the database
            await newImport.save();
            imports.push(newImport);
            
            // Process the file asynchronously (don't wait for completion)
            // This allows the response to be sent quickly while processing continues
            processFile(file, newImport._id);
        }
        
        // If there's audit log middleware data in the request
        if (req.auditLog) {
            // Update the BlockList audit log with results
            req.auditLog.results = imports.map(imp => ({
                id: imp._id.toString(),
                filename: imp.filename,
                status: imp.status
            }));
            // Save the updated audit log
            await req.auditLog.save();
        }
        
        // Return 201 Created with import information
        res.status(201).json({ 
            message: 'Files uploaded and scheduled for processing', 
            imports 
        });
    } catch (err) {
        // Log the error for debugging
        logger.error('Upload error:', err);
        
        // Cleanup temporary files to avoid disk space issues
        for (const file of req.files) {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }
        
        // Return 500 Server Error with details
        res.status(500).json({ error: 'Server error during upload', details: err.message });
    }
};

/**
 * Get recent imports
 * Retrieves the most recent import records for display in the UI
 * 
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with import records
 */
export const getRecentImports = async (req, res) => {
    try {
        // Query the database for the most recent imports
        // Sort by creation date (newest first) and limit to 10 records
        const imports = await Import.find()
            .sort({ createdAt: -1 })
            .limit(10);
        
        // Return the import records as JSON
        res.json(imports);
    } catch (err) {
        // Log the error for debugging
        logger.error('Error fetching imports:', err);
        // Return 500 Server Error with details
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

/**
 * Get import details by ID
 * Retrieves detailed information about a specific import
 * 
 * @async
 * @param {Object} req - Express request object with import ID parameter
 * @param {Object} res - Express response object
 * @returns {Object} - JSON response with import details
 */
export const getImportById = async (req, res) => {
    try {
        // Find the import by ID
        const importItem = await Import.findById(req.params.id);
        
        // If no import found with that ID
        if (!importItem) {
            // Return 404 Not Found
            return res.status(404).json({ error: 'Import not found' });
        }
        
        // Return the import record as JSON
        res.json(importItem);
    } catch (err) {
        // Log the error for debugging
        logger.error('Error fetching import:', err);
        // Return 500 Server Error with details
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

/**
 * Process the uploaded CSV file
 * This function passes the file to the CSV processing service
 * 
 * @async
 * @param {Object} file - Uploaded file object from multer
 * @param {String} importId - Import record ID
 * @returns {Promise<void>}
 */
async function processFile(file, importId) {
    try {
        // Initialize counter for entries updated
        let entriesUpdated = 0;
        
        // Process the CSV file using the importCSVService
        // This will also handle Elasticsearch indexing
        entriesUpdated = await processImportCSV(file.path, importId);
        
        logger.info(`Successfully processed CSV file with ${entriesUpdated} entries`);
        
    } catch (err) {
        // Log the error for debugging
        logger.error(`Error processing CSV file:`, err);
        
        // Update import status to failed if not already updated by the service
        const importRecord = await Import.findById(importId);
        if (importRecord && importRecord.status !== 'failed') {
            await Import.findByIdAndUpdate(importId, { 
                status: 'failed',
                processingError: err.message
            });
        }
        
        // Try to clean up the temp file if it exists
        try {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        } catch (cleanupErr) {
            logger.error('Error cleaning up file:', cleanupErr);
        }
    }
}