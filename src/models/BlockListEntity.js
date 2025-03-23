// src/models/BlockListEntity.js
/**
 * MongoDB schema for entities (companies, organizations) in the blocklist database
 * This model defines the structure of entity records that are imported
 * from CSV files and used for sanctions screening.
 * 
 * @author SanctionGuard Development Team
 */

// IMPORTANT: Use the special blocklistMongoose instance
import { blocklistMongoose } from '../config/blocklistDB.js';

/**
 * Define the schema for entities in the sanction blocklist
 * Each field is defined with appropriate type and validation
 */
const BlockListEntitySchema = new blocklistMongoose.Schema({
    // Unique identifier for the entity in the reference system
    referenceNumber: {
        type: String, 
        required: true,  // This field must be present
        unique: true,    // No duplicate reference numbers allowed
        index: true      // Index this field for faster lookups
    },
    
    // Primary name of the entity
    name: {
        type: String,
        required: true,  // Entity must have a name
        index: true      // Index for faster name searches
    },
    
    // Alternative names the entity might be known as
    aliasNames: {
        type: [String],  // Array of strings
        default: []      // Default to empty array if not provided
    },
    
    // Full addresses associated with the entity
    addresses: {
        type: [String],
        default: []
    },
    
    // Street component of addresses (used in some formats)
    addressStreet: {
        type: [String],
        default: []
    },
    
    // City component of addresses
    addressCity: {
        type: [String],
        default: []
    },
    
    // Country component of addresses
    addressCountry: {
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
    collection: 'entities' 
});

/**
 * Add a text index for more efficient text searching at MongoDB level
 * This creates a full text search index with different weights for each field
 * allowing more relevant search results
 */
BlockListEntitySchema.index(
    { 
        name: 'text',         // Index name for text search
        aliasNames: 'text'    // Index alias names for text search
    },
    {
        // Weights determine importance of each field in search results
        weights: {
            name: 10,         // Name matches are most important
            aliasNames: 5     // Alias matches are less important
        },
        name: "text_index"    // Name this index for easier reference
    }
);

/**
 * Middleware to update lastUpdated timestamp before saving
 * This runs before any findOneAndUpdate operation
 */
BlockListEntitySchema.pre('findOneAndUpdate', function(next) {
    this.set({ lastUpdated: new Date() });  // Set lastUpdated to current time
    next();  // Continue with the update
});

// Create and export the model from the schema
const BlockListEntity = blocklistMongoose.model('BlockListEntity', BlockListEntitySchema);

export default BlockListEntity;