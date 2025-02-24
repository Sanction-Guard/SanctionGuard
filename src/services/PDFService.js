const pdfParse = require('pdf-parse');
const fs = require('fs');
const Person = require('../models/Person');
const Entity = require('../models/Entity');

const extractTextFromPDF = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        throw new Error('Failed to process PDF: ' + error.message);
    }
};

const processExtractedText = (extractedText) => {
    // Simulating extracted individuals and entities (Modify this logic as needed)
    return {
        individuals: [{ name: "John Doe", reference_number: "12345" }],
        entities: [{ name: "ABC Corp", reference_number: "67890" }]
    };
};

const storeExtractedData = async (individuals, entities) => {
    const individualBulkOps = individuals.map(entry => ({
        updateOne: {
            filter: { reference_number: entry.reference_number },
            update: { $set: entry },
            upsert: true
        }
    }));

    const entityBulkOps = entities.map(entity => ({
        updateOne: {
            filter: { reference_number: entity.reference_number },
            update: { $set: entity },
            upsert: true
        }
    }));

    const individualResult = await Person.bulkWrite(individualBulkOps);
    const entityResult = await Entity.bulkWrite(entityBulkOps);

    return {
        individuals: {
            insertedCount: individualResult.upsertedCount || 0,
            modifiedCount: individualResult.modifiedCount || 0
        },
        entities: {
            insertedCount: entityResult.upsertedCount || 0,
            modifiedCount: entityResult.modifiedCount || 0
        }
    };
};

module.exports = { extractTextFromPDF, processExtractedText, storeExtractedData };
