const fs = require('fs');
const { extractTextFromPDF, processExtractedText } = require('../utils/pdfExtractor');
const Person = require('../models/Person');
const Entity = require('../models/Entity');

const uploadAndExtract = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded or invalid file type.' });
        }

        const filePath = req.file.path;
        let extractedText;

        try {
            extractedText = await extractTextFromPDF(filePath);
            console.log("🔍 Extracted Text:", extractedText); // Debugging Log
        } catch (error) {
            console.error('Error extracting text from PDF:', error.message);
            return res.status(400).json({ error: 'The uploaded file is not a valid PDF.' });
        }

        const { individuals, entities } = processExtractedText(extractedText);

        // Save to MongoDB
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

        fs.unlinkSync(filePath); // Delete file after processing

        res.json({
            message: 'Data stored successfully',
            individuals: {
                insertedCount: individualResult.upsertedCount || 0,
                modifiedCount: individualResult.modifiedCount || 0
            },
            entities: {
                insertedCount: entityResult.upsertedCount || 0,
                modifiedCount: entityResult.modifiedCount || 0
            }
        });
    } catch (error) {
        console.error('Error processing PDF:', error.message);
        if (req.file) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: 'Failed to process the PDF', details: error.message });
    }
};

module.exports = { uploadAndExtract };
