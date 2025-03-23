// src/models/BlockListIndividual.js
/**
 * MongoDB schema for individuals in the blocklist database
 * This model defines the structure of individual records that are imported
 * from CSV files and used for sanctions screening.
 * 
 * @author SanctionGuard Development Team
 */

// IMPORTANT: Use the special blocklistMongoose instance
import { blocklistMongoose } from '../config/blocklistDB.js';

/**
 * Define the schema for individuals in the sanction blocklist
 * Each field is defined with appropriate type and validation
 */
const BlockListIndividualSchema = new blocklistMongoose.Schema({
    // Unique identifier for the individual in the reference system
    referenceNumber: {
        type: String, 
        required: true,  // This field must be present
        unique: true,    // No duplicate reference numbers allowed
        index: true      // Index this field for faster lookups
    },
    
    // First name of the individual
    firstName: {
        type: String,
        index: true      // Index for faster name searches
    },
    
    // Second name/middle name of the individual
    secondName: {
        type: String,
        index: true      // Index for faster name searches
    },
    
    // Third/last name of the individual
    thirdName: {
        type: String
    },
    
    // Date of birth (stored as string to handle various formats)
    dateOfBirth: {
        type: String
    },
    
    // National ID number
    nicNumber: {
        type: String
    },
    
    // Alternative names the person might be known as
    aliasNames: {
        type: [String],  // Array of strings
        default: []      // Default to empty array if not provided
    },
    
    // Titles the person holds (Dr., Mr., etc.)
    title: {
        type: [String],
        default: []
    },
    
    // Nationality information
    nationality: {
        type: [String],
        default: []
    },
    
    // Address city information
    addressCity: {
        type: [String],
        default: []
    },
    
    // Address country information
    addressCountry: {
        type: [String],
        default: []
    },
    
    // Year of birth (may be different from full date of birth)
    dobYear: {
        type: [String],
        default: []
    },
    
    // City of birth
    birthCity: {
        type: [String],
        default: []
    },
    
    // Country of birth
    birthCountry: {
        type: [String],
        default: []
    },
    
    // Type of documentation (passport, national ID, etc.)
    docType: {
        type: [String],
        default: []
    },
    
    // Document numbers
    docNumber: {
        type: [String],
        default: []
    },
    
    // Country that issued the documentation
    docIssueCountry: {
        type: [String],
        default: []
    },
    
    // Source of the data (e.g., 'CSV Import - Local')
    source: {
        type: String
    },
    
    // Original file name that contained this record
    sourceFile: {
        type: String
    },
    
    // Reference to the import record that created this entity
    importId: {
        type: blocklistMongoose.Schema.Types.ObjectId,  // Reference to Import model
        ref: 'Import'  // Name of the referenced model
    },
    
    // Type of sanctions list (UN, Local, Other)
    listType: {
        type: String,
        enum: ['UN Sanctions', 'Local Sanctions', 'Other'],  // Restricted to these values
        default: 'Other'
    },
    
    // Whether this record is active (used for soft delete)
    isActive: {
        type: Boolean,
        default: true
    },
    
    // When the record was created
    created: {
        type: Date,
        default: Date.now
    },
    
    // When the record was last updated
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, { 
    // Add timestamps for created/updated tracking (createdAt, updatedAt)
    timestamps: true,
    // Specify collection name explicitly
    collection: 'individuals'
});

/**
 * Add a text index for more efficient text searching at MongoDB level
 * This creates a full text search index with different weights for each field
 * allowing more relevant search results
 */
BlockListIndividualSchema.index(
    { 
        firstName: 'text',    // Index first name for text search
        secondName: 'text',   // Index second name for text search
        thirdName: 'text',    // Index third name for text search
        aliasNames: 'text'    // Index alias names for text search
    },
    {
        // Weights determine importance of each field in search results
        weights: {
            firstName: 10,    // First name matches are most important
            secondName: 8,    // Second name matches are very important
            thirdName: 6,     // Third name matches are moderately important
            aliasNames: 4     // Alias matches are somewhat important
        },
        name: "text_index"    // Name this index for easier reference
    }
);

/**
 * Middleware to update lastUpdated timestamp before saving
 * This runs before any findOneAndUpdate operation
 */
BlockListIndividualSchema.pre('findOneAndUpdate', function(next) {
    this.set({ lastUpdated: new Date() });  // Set lastUpdated to current time
    next();  // Continue with the update
});

// Create and export the model from the schema
const BlockListIndividual = blocklistMongoose.model('BlockListIndividual', BlockListIndividualSchema);

export default BlockListIndividual;