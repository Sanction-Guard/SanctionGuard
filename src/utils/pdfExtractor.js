const fs = require('fs');
const pdfParse = require('pdf-parse');

/**
 * Extracts text content from a PDF file.
 * @param {string} filePath - The path to the PDF file.
 * @returns {Promise<string>} - Extracted text from the PDF.
 */
const extractTextFromPDF = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        console.error('Error extracting text from PDF:', error.message);
        throw new Error('Failed to extract text from PDF');
    }
};

/**
 * Processes extracted text to filter and structure the data.
 * @param {string} text - Extracted text from the PDF.
 * @returns {string[]} - Filtered lines containing specific keywords.
 */
const processExtractedText = (text) => {
    const lines = text.split('\n');
    const filteredLines = lines.filter(line => line.includes('Name'));// Replace with your keyword
    return filteredLines;
};

module.exports = { extractTextFromPDF, processExtractedText };
