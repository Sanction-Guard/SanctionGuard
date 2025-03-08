const { extractTextFromPDF, processExtractedText } = require('../utils/pdfExtractor');
const Person = require('../models/Person');
const Entity = require('../models/Entity');

/**
 * Extracts and processes text from a PDF file.
 * @param {string} filePath - Path to the uploaded PDF file.
 * @returns {Promise<Object>} - Processed individuals and entities.
 */
const extractAndProcessPDF = async (filePath) => {
    try {
        const extractedText = await extractTextFromPDF(filePath);
        

        const { individuals, entities } = processExtractedText(extractedText);
        return { individuals, entities };
    } catch (error) {
        console.error('Error in extractAndProcessPDF:', error.message);
        throw new Error('Failed to extract and process PDF');
    }
};

/**
 * Saves individuals and entities to the database.
 * @param {Array} individuals - List of individuals to save.
 * @param {Array} entities - List of entities to save.
 * @returns {Promise<Object>} - Results of the database operations.
 */
const saveToDatabase = async (individuals, entities) => {
    try {
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

        const [individualResult, entityResult] = await Promise.all([
            Person.bulkWrite(individualBulkOps),
            Entity.bulkWrite(entityBulkOps)
        ]);

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
    } catch (error) {
        console.error('Error in saveToDatabase:', error.message);
        throw new Error('Failed to save data to the database');
    }
};

module.exports = {
    extractAndProcessPDF,
    saveToDatabase
};