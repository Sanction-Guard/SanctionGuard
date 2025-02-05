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
 * Adds a blank line after each individual's name group.
 * @param {string} text - Extracted text from the PDF.
 * @returns {string[]} - Filtered and structured names with blank lines between groups.
 */
const processExtractedText = (text) => {
    const lines = text.split('\n');

    // Filter lines containing "Name:" and process them
    const nameLines = lines.filter(line => line.includes('Name:'));

    // Extract and clean names
    const namesWithSpaces = nameLines.flatMap(line => {
        // Extract the portion after "Name:"
        const match = line.match(/Name:\s*(.*)/);
        if (match) {
            // Split by digits or other delimiters and remove "script original" and similar phrases
            const cleanedNames = match[1]
                .split(/\d+\:|(?:\(.?script.?\))/i) // Split by digits followed by colon or script notes
                .map(name => name.trim()) // Trim whitespace
                .filter(name => name.length > 0); // Remove empty names

            // Add a blank line after processing one individual's names
            return [...cleanedNames, '  ']; // Add empty string to represent a blank line
        }
        return [];
    });

    return namesWithSpaces;
};

module.exports = { extractTextFromPDF, processExtractedText };
