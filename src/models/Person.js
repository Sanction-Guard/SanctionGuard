const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
    reference_number: {
        type: String,
        required: true,
        unique: true,
        match: /^IN\/CA\/\d{4}\/\d{2}$/
    },
    first_name: {
        type: String,
        required: true,
        trim: true
    },
    second_name: {
        type: String,
        trim: true
    },
    third_name: {
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
});

module.exports = mongoose.model('Person', personSchema);