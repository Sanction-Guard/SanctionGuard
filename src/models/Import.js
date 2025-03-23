// src/models/Import.js
import { blocklistMongoose } from '../config/blocklistDB.js';

const importSchema = new blocklistMongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        enum: ['pdf', 'csv', 'xml'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    entriesUpdated: {
        type: Number,
        default: 0
    },
    processingError: {
        type: String,
        default: null
    },
    fileSize: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { collection: 'imports' }); // Specify collection name

// Pre-save middleware to update the updatedAt field
importSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

export default blocklistMongoose.model('Import', importSchema);