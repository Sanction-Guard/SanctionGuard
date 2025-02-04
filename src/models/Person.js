const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
    reference_number: {
        type: String,
        required: true,
        unique: true,
        match: /^IN\/CA\/\d{4}\/\d{2}$/
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    secondName: {
        type: String,
        trim: true
    },
    thirdName: {
        type: String,
        trim: true
    },
    aka: [{
        type: String,
        trim: true
    }],
    dob: {
        type: String,
        required: true,
        match: /^\d{2}\.\d{2}\.\d{4}$/
    },
    nic: {
        type: String,
        required: true,
        match: /^[A-Z0-9]{10,12}$/,
        uppercase: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
}, { collection: 'individuals' }); // Explicitly set the collection name to 'individuals'

module.exports = mongoose.model('Person', personSchema);