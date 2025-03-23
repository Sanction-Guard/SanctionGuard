// src/controllers/importController.js
import fs from 'fs';
import path from 'path';
import { processImportCSV } from '../services/importCSVService.js';
import Import from '../models/Import.js';
import BlockListAuditLog from '../models/BlockListAuditLog.js';
import { logger } from '../utils/logger.js';

/**
 * Upload and process CSV files
 * This controller handles file uploads, validates file types, and schedules CSV processing
 * 
 * @param {Object} req - Express request object containing uploaded files
 * @param {Object} res - Express response object
 */
export const uploadFiles = async (req, res) => {
    // Validate that files were uploaded
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    
    const imports = [];
    
    try {
        // Check if any files are not CSV
        const nonCsvFiles = req.files.filter(file => {
            const fileExtension = path.extname(file.originalname).toLowerCase();
            return fileExtension !== '.csv';
        });
        
        // Return error if any non-CSV files found
        if (nonCsvFiles.length > 0) {
            return res.status(400).json({ 
                error: 'Only CSV files are supported at this time' 
            });
        }
        
        // Check for duplicate files before processing
        for (const file of req.files) {
            try {
                // Check if the file has been previously imported
                const existingImport = await Import.findOne({ 
                    filename: file.originalname,
                });
                
                if (existingImport) {
                    return res.status(409).json({ 
                        error: `Duplicate file detected: "${file.originalname}" has already been imported`
                    });
                }
            } catch (dbError) {
                logger.error('Database error checking duplicates:', dbError);
                // Continue processing even if duplicate check fails
            }
        }
        
        // Process each uploaded file
        for (const file of req.files) {
            const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
            
            // Create import record
            const newImport = new Import({
                filename: file.originalname,
                fileType: 'csv', // We're only supporting CSV
                fileSize: file.size,
                status: 'pending'
            });
            
            await newImport.save();
            imports.push(newImport);
            
            // Process the file asynchronously (don't wait for completion)
            processFile(file, newImport._id);
        }
        
        // If there's audit log middleware
        if (req.auditLog) {
            // Update the BlockList audit log with results
            req.auditLog.results = imports.map(imp => ({
                id: imp._id.toString(),
                filename: imp.filename,
                status: imp.status
            }));
            await req.auditLog.save();
        }
        
        res.status(201).json({ 
            message: 'Files uploaded and scheduled for processing', 
            imports 
        });
    } catch (err) {
        logger.error('Upload error:', err);
        
        // Cleanup temporary files
        for (const file of req.files) {
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        }
        
        res.status(500).json({ error: 'Server error during upload', details: err.message });
    }
};

/**
 * Get recent imports
 * Retrieves the most recent import records for display in the UI
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRecentImports = async (req, res) => {
    try {
        const imports = await Import.find()
            .sort({ createdAt: -1 })
            .limit(10);
        
        res.json(imports);
    } catch (err) {
        logger.error('Error fetching imports:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

/**
 * Get import details by ID
 * Retrieves detailed information about a specific import
 * 
 * @param {Object} req - Express request object with import ID parameter
 * @param {Object} res - Express response object
 */
export const getImportById = async (req, res) => {
    try {
        const importItem = await Import.findById(req.params.id);
        
        if (!importItem) {
            return res.status(404).json({ error: 'Import not found' });
        }
        
        res.json(importItem);
    } catch (err) {
        logger.error('Error fetching import:', err);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

/**
 * Process the uploaded CSV file
 * This function passes the file to the CSV processing service
 * 
 * @param {Object} file - Uploaded file object from multer
 * @param {String} importId - Import record ID
 */
async function processFile(file, importId) {
    try {
        let entriesUpdated = 0;
        
        // Process the CSV file using the importCSVService
        entriesUpdated = await processImportCSV(file.path, importId);
        
        logger.info(`Successfully processed CSV file with ${entriesUpdated} entries`);
        
    } catch (err) {
        logger.error(`Error processing CSV file:`, err);
        
        // Update import status to failed (if not already updated by the service)
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