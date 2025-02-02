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
 * Processes extracted text to filter and extract names, DOBs, and NICs.
 * @param {string} text - Extracted text from the PDF.
 * @returns {Object[]} - List of objects containing names, DOBs, and NICs.
 */
const processExtractedText = (text) => {
    // Split the input text into lines
    const lines = text.split('\n');

    // Array to store extracted information
    const extractedData = [];

    // Regex pattern for extracting name
    const nameRegex = /Name:\s*([A-Za-z\s.]+?)(?:\s*a\.k\.a\s*([A-Za-z\s.]+))?\s*Title:/i;

    // Regex pattern for extracting DOB
    const dobRegex = /DOB:\s*(\d{2}\.\d{2}\.\d{4})/i;

    // Regex pattern for extracting NIC (National Identification Number)
    const nicRegex = /NIC:\s*([A-Z0-9]+)/i;

    // Iterate through lines
    lines.forEach(line => {
        const data = {};

        // Extract names (primary name and alias)
        const nameMatch = line.match(nameRegex);
        if (nameMatch) {
            data.name = nameMatch[1].trim(); // Primary name
            if (nameMatch[2]) {
                data.knownAs = nameMatch[2].trim(); // Alias (a.k.a. name)
            }

        }

        // Extract DOB
        const dobMatch = line.match(dobRegex);
        if (dobMatch) {
            data.dob = dobMatch[1]; // Extract the DOB
        }

        // Extract NIC
        const nicMatch = line.match(nicRegex);
        if (nicMatch) {
            data.nic = nicMatch[1]; // Extract the NIC
        }

        // If any data was extracted, add it to the result array
        if (Object.keys(data).length > 0) {
            extractedData.push(data);
        }
    });

    return extractedData;
};

module.exports = { extractTextFromPDF, processExtractedText };