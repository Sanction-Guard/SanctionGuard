const express = require('express');
const upload = require('../middlewares/fileValidation'); // Ensure this file exists
const PDFController = require('../controllers/PDFController'); // Ensure this file exists

const router = express.Router();

// ✅ Route for PDF Upload and Extraction
router.post('/upload', upload.single('file'), PDFController.uploadAndExtract);

module.exports = router;
