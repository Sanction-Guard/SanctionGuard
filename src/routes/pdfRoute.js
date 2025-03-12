// src/routes/pdfRoute.js
import express from 'express';
import { upload } from '../middlewares/fileValidation.js'; // Ensure this file exists
import { uploadAndExtract } from '../controllers/PDFController.js'; // Ensure this file exists

const router = express.Router();

// ✅ Route for PDF Upload and Extraction
router.post('/upload', upload.single('file'), uploadAndExtract);

export default router;