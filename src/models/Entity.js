import mongoose from 'mongoose';

const entitySchema = new mongoose.Schema({
    firstName: { type: String, required: true, default: null },
    unListType: { type: String, required: true, default: null },
    referenceNumber: { type: String, required: true, default: null },
    aliasNames: { type: [String], default: [null] },
    addressStreet: { type: [String], default: [null] },
    addressCity: { type: [String], default: [null] },
    addressCountry: { type: [String], default: [null] }
});

// Pre-save middleware to transform N/A values to empty strings
entitySchema.pre('save', function(next) {
    // Handle single string fields
    for (const path in this.schema.paths) {
        const schemaType = this.schema.paths[path];
        
        // Handle String type fields
        if (schemaType.instance === 'String' && this[path] === 'N/A') {
            this[path] = '';
        }
        
        // Handle Array of Strings
        if (schemaType.instance === 'Array' && Array.isArray(this[path])) {
            this[path] = this[path].map(val => val === 'N/A' ? '' : val);
        }
    }
    
    next();
});

export default mongoose.model('Entity', entitySchema);
