import { localMongoose } from '../config/db.js'; // Import the local Mongoose instance

const personSchema = new localMongoose.Schema({
    reference_number: {
        type: String,
        required: true,
        unique: true,
        match: /^IN\/CA\/\d{4}\/\d{2}$/,
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
    },
    secondName: {
        type: String,
        trim: true,
    },
    thirdName: {
        type: String,
        trim: true,
    },
    aka: [
        {
            type: String,
            trim: true,
        },
    ],
    dob: {
        type: String,
        required: true,
        match: /^\d{2}\.\d{2}\.\d{4}$/,
    },
    nic: {
        type: String,
        required: true,
        match: /^[A-Z0-9]{10,12}$/,
        uppercase: true,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
}, { collection: 'individuals' }); // Explicitly set the collection name to 'individuals'

const Person = localMongoose.model('Person', personSchema);

export default Person;