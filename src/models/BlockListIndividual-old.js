// src/models/BlockListIndividual.js
import { blocklistMongoose } from '../config/blocklistDB.js';

const blocklistIndividualSchema = new blocklistMongoose.Schema({
    // Basic information
    referenceNumber: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    secondName: {
        type: String,
        trim: true,
        index: true
    },
    thirdName: {
        type: String,
        trim: true
    },
    fullName: {
        type: String,
        trim: true,
        index: true
    },
    
    // Additional identifiers
    aliasNames: {
        type: [String],
        default: [],
        index: true
    },
    title: {
        type: [String],
        default: []
    },
    
    // Dates
    dateOfBirth: {
        type: String,
        index: true
    },
    dobYear: {
        type: [String],
        default: []
    },
    
    // Nationalities and locations
    nationality: {
        type: [String],
        default: [],
        index: true
    },
    birthCity: {
        type: [String],
        default: []
    },
    birthCountry: {
        type: [String],
        default: [],
        index: true
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
    
    // Document information
    nicNumber: {
        type: String,
        index: true
    },
    docType: {
        type: [String],
        default: []
    },
    docNumber: {
        type: [String],
        default: [],
        index: true
    },
    docIssueCountry: {
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
    collection: 'individuals',
    timestamps: { createdAt: 'created', updatedAt: 'lastUpdated' }
});

// Virtual for getting full name
blocklistIndividualSchema.virtual('name').get(function() {
    if (this.fullName) return this.fullName;
    return [this.firstName, this.secondName, this.thirdName]
        .filter(name => name && name.trim() !== '')
        .join(' ');
});

// Pre-save middleware
blocklistIndividualSchema.pre('save', function(next) {
    // Generate fullName if not already present
    if (!this.fullName) {
        this.fullName = [this.firstName, this.secondName, this.thirdName]
            .filter(name => name && name.trim() !== '')
            .join(' ');
    }
    next();
});

// Create model
const BlockListIndividual = blocklistMongoose.model('Individual', blocklistIndividualSchema);

export default BlockListIndividual;
