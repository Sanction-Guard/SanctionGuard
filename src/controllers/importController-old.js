// src/controllers/importController.js
import fs from 'fs';
import path from 'path';
import { processImportCSV } from '../services/importCSVService.js';
import { processImportPDF } from '../services/importPDFService.js';
import Import from '../models/Import.js';
import BlockListAuditLog from '../models/BlockListAuditLog.js';
import { logger } from '../utils/logger.js';
import { checkBlocklistConnection } from '../config/blocklistDB.js';

/**
 * Upload and process files (PDF, CSV, XML)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const uploadFiles = async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    
    // const imports = [];
    
    try {
       // Check for duplicate files before processing
        for (const file of req.files) {
            try {
                const existingImport = await Import.findOne({ 
                    filename: file.originalname,
                });
                
                if (existingImport) {
                    return res.status(409).json({ 
                        error: `Duplicate file detected: "${file.originalname}" has already been imported`
                    });
                }
            } catch (dbError) {
                console.error('Database error checking duplicates:', dbError);
                // Continue processing even if duplicate check fails
            }
        }

        // Continue with the rest of your existing upload code...
        const imports = [];

        // Process each uploaded file
        for (const file of req.files) {
            const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
            
            // Create import record
            const newImport = new Import({
                filename: file.originalname,
                fileType: fileExtension,
                fileSize: file.size,
                status: 'pending'
            });
            
            await newImport.save();
            imports.push(newImport);
            
            // Process the file asynchronously (don't wait for completion)
            processFile(file, newImport._id, fileExtension);
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
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getRecentImports = async (req, res) => {
    try {
        // Ensure BlockList DB is connected
        const isConnected = await checkBlocklistConnection();
        if (!isConnected) {
            return res.status(500).json({ 
                error: 'BlockList database connection issue' 
            });
        }
        
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
 * @param {Object} req - Express request object
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
 * Process the uploaded file based on type
 * @param {Object} file - Uploaded file object
 * @param {String} importId - Import record ID
 * @param {String} fileType - File type (pdf, csv, xml)
 */
async function processFile(file, importId, fileType) {
    try {
        let entriesUpdated = 0;
        
        switch (fileType) {
            case 'csv':
                entriesUpdated = await processImportCSV(file.path, importId);
                break;
            case 'pdf':
                entriesUpdated = await processImportPDF(file.path, importId);
                break;
            case 'xml':
                // XML processing is not implemented in this version
                throw new Error('XML processing through UI upload not yet implemented');
            default:
                throw new Error(`Unsupported file type: ${fileType}`);
        }
        
        logger.info(`Successfully processed ${fileType} file with ${entriesUpdated} entries`);
        
    } catch (err) {
        logger.error(`Error processing ${fileType} file:`, err);
        
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