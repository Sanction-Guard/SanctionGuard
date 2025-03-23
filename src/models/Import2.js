// src/models/Import.js
/**
 * MongoDB schema for tracking file imports
 * This model records metadata about each import operation, 
 * including status, progress, and error information.
 * 
 * @author SanctionGuard Development Team
 * @version 1.0.0
 */

import mongoose from 'mongoose';

/**
 * Define the schema for import records
 * Each import operation creates one record
 */
const ImportSchema = new mongoose.Schema({
    // Original filename uploaded by the user
    filename: {
        type: String,
        required: true
    },
    
    // Type of file (csv, pdf, xml, etc.)
    fileType: {
        type: String,
        required: true
    },
    
    // Size of the file in bytes
    fileSize: {
        type: Number
    },
    
    // Current status of the import process
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    
    // Number of entries updated/created during this import
    entriesUpdated: {
        type: Number,
        default: 0
    },
    
    // Error message if the import failed
    processingError: {
        type: String
    },
    
    // ID of the user who initiated the import (if applicable)
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    // Add automatic timestamps (createdAt, updatedAt)
    timestamps: true
});

/**
 * Add indexes for common queries
 */
ImportSchema.index({ createdAt: -1 });  // Index creation date for sorting
ImportSchema.index({ status: 1 });      // Index status for filtering
ImportSchema.index({ filename: 1 });    // Index filename for searching

// Create and export the model from the schema
const Import = mongoose.model('Import', ImportSchema);

export default Import;