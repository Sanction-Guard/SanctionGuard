const express = require('express');
const multer = require('multer');
const { extractTextFromPDF, processExtractedText } = require('../utils/pdfExtractor');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Endpoint to handle PDF file upload
router.post('/upload-pdf', upload.single('file'), async (req, res) => {
    try {
        const filePath = req.file.path;

        // Extract text from the uploaded PDF
        const extractedText = await extractTextFromPDF(filePath);

        // Process the extracted text for specific data
        const processedText = processExtractedText(extractedText);

        res.json({ processedText });
    } catch (error) {
        res.status(500).json({ error: 'Failed to process the PDF' });
    }
});

module.exports = router;
