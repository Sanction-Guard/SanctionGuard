import mongoose from 'mongoose';

const individualSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    secondName: { type: String, required: true },
    thirdName: { type: String, required: true },
    unListType: { type: String, required: true },
    referenceNumber: { type: String, required: true },
    title: { type: [String], default: ['N/A'] },
    nationality: { type: [String], default: ['N/A'] },
    aliasNames: { type: [String], default: ['N/A'] },
    addressCity: { type: [String], default: ['N/A'] },
    addressCountry: { type: [String], default: ['N/A'] },
    dobYear: { type: [String], default: ['N/A'] },
    birthCity: { type: [String], default: ['N/A'] },
    birthCountry: { type: [String], default: ['N/A'] },
    docType: { type: [String], default: ['N/A'] },
    docNumber: { type: [String], default: ['N/A'] },
    docIssueCountry: { type: [String], default: ['N/A'] }
});

const Individual = mongoose.model('Individual', individualSchema);

export default Individual;