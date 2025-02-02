const express = require('express');
const multer = require('multer');
const { extractTextFromPDF, processExtractedText } = require('../utils/pdfExtractor');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true); // Accept the file
        } else {
            cb(new Error('Only PDF files are allowed!'), false); // Reject the file
        }
    },
});

// Endpoint to handle PDF file upload
router.post('/upload-pdf', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded or invalid file type.' });
        }

        const filePath = req.file.path;

        // Extract text from the uploaded PDF
        let extractedText;
        try {
            extractedText = await extractTextFromPDF(filePath);
        } catch (error) {
            console.error('Error extracting text from PDF:', error.message);
            return res.status(400).json({ error: 'The uploaded file is not a valid PDF.' });
        }

        // Process the extracted text for specific data
        const processedText = processExtractedText(extractedText);

        // Delete the uploaded file after processing
        fs.unlinkSync(filePath);

        res.json({ processedText });
    } catch (error) {
        console.error('Error processing PDF:', error.message);

        // Delete the uploaded file in case of an error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({ error: 'Failed to process the PDF' });
    }
});

module.exports = router;