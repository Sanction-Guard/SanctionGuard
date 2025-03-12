// src/models/EntityLocal.js
import mongoose from 'mongoose';

const entitySchema = new mongoose.Schema({
    reference_number: {
        type: String,
        required: true,
        unique: true,
        match: /^EN\/CA\/\d{4}\/\d{2}$/,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    aka: [
        {
            type: String,
            trim: true,
        },
    ],
    addresses: [
        {
            type: String,
            trim: true,
        },
    ],
    created_at: {
        type: Date,
        default: Date.now,
    },
}, { collection: 'entities' }); // Explicitly set the collection name to 'entities'

const EntityLocal = mongoose.model('EntityLocal', entitySchema);

export default EntityLocal;