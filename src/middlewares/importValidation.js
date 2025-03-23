// src/middlewares/importValidation.js
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

/**
 * Ensures the uploads directory exists for storing imported files
 * Creates the directory if it doesn't exist
 */
const uploadsDir = path.join(process.cwd(), 'uploads', 'imports');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    logger.info('Created imports directory at:', uploadsDir);
}

/**
 * Configure multer storage for file uploads
 * Sets destination and filename for uploaded files
 */
const storage = multer.diskStorage({
    // Set the destination folder for uploaded files
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    // Generate a unique filename for each uploaded file
    filename: (req, file, cb) => {
        // Create unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, 'import-' + uniqueSuffix + ext);
    }
});

/**
 * Filter function to validate file types
 * Only allows CSV files to be uploaded
 * 
 * @param {Object} req - Express request object
 * @param {Object} file - File being uploaded
 * @param {Function} cb - Callback function
 */
const fileFilter = (req, file, cb) => {
    // Check MIME types for CSV files
    const allowedMimeTypes = [
        'text/csv',                  // Standard CSV MIME type
        'application/vnd.ms-excel',  // Excel files (sometimes used for CSV)
        'application/csv'            // Alternative CSV MIME type
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        // Fallback to extension check for some clients that might not report MIME types correctly
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext === '.csv') {
            cb(null, true);
        } else {
            logger.error(`Rejected file upload with MIME type: ${file.mimetype}, extension: ${ext}`);
            cb(new Error('Invalid file type. Only CSV files are allowed.'), false);
        }
    }
};

/**
 * Create multer upload middleware with configuration
 * Limits file size and count, and validates file types
 */
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB size limit
        files: 5                     // Maximum 5 files per upload
    }
});

/**
 * Middleware for handling multiple file uploads
 * Processes up to 5 files in a single request
 */
export const uploadFiles = upload.array('files', 5);

/**
 * Middleware for handling single file upload
 * Used for backward compatibility with older code
 */
export const uploadSingleFile = upload.single('file');