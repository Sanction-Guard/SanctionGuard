// src/models/BlockListEntity.js
import { blocklistMongoose } from '../config/blocklistDB.js';

const blocklistEntitySchema = new blocklistMongoose.Schema({
    // Basic information
    referenceNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    
    // Additional identifiers
    aliasNames: {
        type: [String],
        default: [],
        index: true
    },
    
    // Addresses
    addressStreet: {
        type: [String],
        default: []
    },
    addressCity: {
        type: [String],
        default: []
    },
    addressCountry: {
        type: [String],
        default: [],
        index: true
    },
    addresses: {
        type: [String],
        default: []
    },
    
    // Source information
    listType: {
        type: String,
        default: 'unknown',
        index: true
    },
    source: {
        type: String,
        required: true,
        default: 'Import',
        index: true
    },
    sourceFile: {
        type: String,
        default: null
    },
    importId: {
        type: String,
        index: true
    },
    
    // Risk and status
    riskScore: {
        type: Number,
        default: 100,
        index: true
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    
    // Metadata
    created: {
        type: Date,
        default: Date.now,
        index: true
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, 
{ 
    collection: 'entities',
    timestamps: { createdAt: 'created', updatedAt: 'lastUpdated' }
});

// Create model
const BlockListEntity = blocklistMongoose.model('Entity', blocklistEntitySchema);

export default BlockListEntity;
