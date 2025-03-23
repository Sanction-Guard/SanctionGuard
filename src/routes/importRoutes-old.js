// src/routes/importRoutes.js
import express from 'express';
import { uploadFiles, getRecentImports, getImportById } from '../controllers/importController.js';
import { uploadFiles as uploadMiddleware } from '../middlewares/importValidation.js';
import importAuditLogMiddleware from '../middlewares/importAuditLog.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * @route POST /api/imports/upload
 * @desc Upload and process sanction list files (PDF, CSV, XML)
 * @access Public (consider adding authentication middleware in production)
 */
router.post('/upload', importAuditLogMiddleware, (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
        if (err) {
            logger.error('File upload middleware error:', err);
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({ 
                    error: 'File size exceeds limit. Maximum size is 10MB.'
                });
            }
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(413).json({ 
                    error: 'Too many files uploaded. Maximum is 5 files.'
                });
            }
            return res.status(400).json({ 
                error: err.message || 'Error uploading files'
            });
        }
        
        // Pass to the controller
        uploadFiles(req, res, next);
    });
});

/**
 * @route GET /api/imports/recent
 * @desc Get recent import history
 * @access Public (consider adding authentication middleware in production)
 */
router.get('/recent', getRecentImports);

/**
 * @route GET /api/imports/:id
 * @desc Get details of a specific import
 * @access Public (consider adding authentication middleware in production)
 */
router.get('/:id', getImportById);

export default router;