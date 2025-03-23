// src/middlewares/importValidation.js
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger.js';

// Ensure the imports directory exists (separate from other uploads)
const uploadsDir = path.join(process.cwd(), 'uploads', 'imports');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    logger.info('Created imports directory at:', uploadsDir);
}

// Configure multer storage specifically for imports
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Create unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, 'import-' + uniqueSuffix + ext);
    }
});

// Filter function to validate file types for imports
const fileFilter = (req, file, cb) => {
    // Check MIME types for supported file formats
    const allowedMimeTypes = [
        'application/pdf',                  // PDF files
        'text/csv',                         // CSV files
        'application/vnd.ms-excel',         // Excel files (old format)
        'application/csv',                  // Sometimes CSV files are reported as this
        'application/xml',                  // XML files
        'text/xml'                          // XML files alternative MIME type
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        // Fallback to extension check for some clients that might not report MIME types correctly
        const ext = path.extname(file.originalname).toLowerCase();
        if (['.pdf', '.csv', '.xml'].includes(ext)) {
            cb(null, true);
        } else {
            logger.error(`Rejected file upload with MIME type: ${file.mimetype}, extension: ${ext}`);
            cb(new Error('Invalid file type. Only PDF, CSV, and XML files are allowed.'), false);
        }
    }
};

// Create multer upload middleware with configuration specific to imports
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB size limit
        files: 5                     // Maximum 5 files per upload
    }
});

// Export middleware for multiple file uploads
export const uploadFiles = upload.array('files', 5);

// Export middleware for single file upload (for backward compatibility)
export const uploadSingleFile = upload.single('file');
