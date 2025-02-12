import mongoose from 'mongoose';

const entitySchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    unListType: { type: String, required: true },
    referenceNumber: { type: String, required: true },
    aliasNames: { type: [String], default: ['N/A'] },
    addressStreet: { type: [String], default: ['N/A'] },
    addressCity: { type: [String], default: ['N/A'] },
    addressCountry: { type: [String], default: ['N/A'] }
});

export default mongoose.model('Entity', entitySchema);

;
