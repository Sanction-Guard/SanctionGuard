const express = require('express');
const multer = require('multer');
const { extractTextFromPDF, processExtractedText } = require('../utils/pdfExtractor');
const fs = require('fs');
const mongoose = require('mongoose');
const { MongoClient, ServerApiVersion } = require('mongodb');
const Person = require('../models/Person');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    },
});

// MongoDB connection setup
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });
        console.log('Connected to MongoDB Atlas');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

// Initialize MongoDB connection
connectDB();

// Endpoint to handle PDF file upload
router.post('/upload-pdf', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded or invalid file type.' });
        }

        const filePath = req.file.path;
        let extractedText;

        try {
            extractedText = await extractTextFromPDF(filePath);
        } catch (error) {
            console.error('Error extracting text from PDF:', error.message);
            return res.status(400).json({ error: 'The uploaded file is not a valid PDF.' });
        }

        const processedData = processExtractedText(extractedText);
        const entries = Object.values(processedData);

        const bulkOps = entries.map(entry => ({
            updateOne: {
                filter: { reference_number: entry.reference_number },
                update: { $set: entry },
                upsert: true
            }
        }));

        const result = await Person.bulkWrite(bulkOps);
        fs.unlinkSync(filePath);

        res.json({
            message: 'Data stored successfully',
            insertedCount: result.upsertedCount,
            modifiedCount: result.modifiedCount
        });

    } catch (error) {
        console.error('Error processing PDF:', error.message);
        if (req.file) fs.unlinkSync(req.file.path);

        res.status(500).json({
            error: 'Failed to process the PDF',
            details: error.message
        });
    }
});

module.exports = router;