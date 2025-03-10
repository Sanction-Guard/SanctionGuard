// src/controllers/PDFController.js
import fs from 'fs';
import { extractAndProcessPDF, saveToDatabase } from '../services/pdfService.js';

const uploadAndExtract = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded or invalid file type.' });
    }

    const filePath = req.file.path;

    try {
        // Step 1: Extract and process PDF
        const { individuals, entities } = await extractAndProcessPDF(filePath);

        // Step 2: Save to database
        const saveResult = await saveToDatabase(individuals, entities);

        // Step 3: Delete the file after processing
        fs.unlinkSync(filePath);

        // Step 4: Send response
        res.json({
            message: 'Data stored successfully',
            individuals: {
                insertedCount: saveResult.individuals.insertedCount,
                modifiedCount: saveResult.individuals.modifiedCount,
            },
            entities: {
                insertedCount: saveResult.entities.insertedCount,
                modifiedCount: saveResult.entities.modifiedCount,
            },
        });
    } catch (error) {
        console.error('Error processing PDF:', error.message);
        if (req.file) fs.unlinkSync(req.file.path); // Clean up file on error
        res.status(500).json({ error: 'Failed to process the PDF', details: error.message });
    }
};

export { uploadAndExtract };