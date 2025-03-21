import mongoose from 'mongoose';

const individualSchema = new mongoose.Schema({
    firstName: { type: String, required: true, default: null },
    secondName: { type: String, required: true, default: null },
    thirdName: { type: String, required: true, default: null },
    unListType: { type: String, required: true, default: null },
    referenceNumber: { type: String, required: true },
    title: { type: [String], default: [null] },
    nationality: { type: [String], default: [null] },
    aliasNames: { type: [String], default: [null] },
    addressCity: { type: [String], default: [null] },
    addressCountry: { type: [String], default: [null] },
    dobYear: { type: [String], default: [null] },
    birthCity: { type: [String], default: [null] },
    birthCountry: { type: [String], default: [null] },
    docType: { type: [String], default: [null] },
    docNumber: { type: [String], default: [null] },
    docIssueCountry: { type: [String], default: [null] }
});

// Pre-save middleware to transform N/A values to empty strings
individualSchema.pre('save', function(next) {
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

export default mongoose.model('Individual', individualSchema);