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
    // Split text into individual entries using reference numbers
    const entryRegex = /(IN\/CA\/\d{4}\/\d{2})([\s\S]*?)(?=IN\/CA\/\d{4}\/\d{2}|$)/g;
    const entries = [];
    let match;

    while ((match = entryRegex.exec(text)) !== null) {
        entries.push({
            reference: match[1],
            content: match[2].trim()
        });
    }

    const result = {};

    entries.forEach(({ reference, content }) => {
        const entry = {
            first_name: '',
            second_name: '',
            third_name: '',
            aka: [],
            dob: '',
            nic: '',
            reference_number: reference
        };

        // Enhanced name extraction with multiple aliases
        const nameMatch = content.match(/Name:\s*((?:.(?!a\.k\.a))*?)(?:\s+a\.k\.a\s+(.+?))?(?=\s+Title:)/is);
        if (nameMatch) {
            // Split the primary name into parts
            const nameParts = nameMatch[1].trim().split(/\s+/);

            // Assign name parts to first_name, second_name, and third_name
            entry.first_name = nameParts[0] || '';
            entry.second_name = nameParts[1] || '';
            entry.third_name = nameParts.slice(2).join(' ') || '';

            // Extract aliases (a.k.a. names)
            if (nameMatch[2]) {
                entry.aka = nameMatch[2].split(/\s*,\s*|\s+a\.k\.a\s+/i)
                    .map(a => a.trim())
                    .filter(a => a);
            }
        }

        // Robust date extraction with different formats
        const dobMatch = content.match(/DOB:\s*(\d{2}[.-]\d{2}[.-]\d{4})/i);
        if (dobMatch) {
            entry.dob = dobMatch[1].replace(/-/g, '.');
        }

        // Comprehensive NIC pattern matching
        const nicMatch = content.match(/NIC:\s*([A-Z0-9]+)/i);
        if (nicMatch) {
            entry.nic = nicMatch[1].toUpperCase();
        }

        result[reference] = entry;
    });

    return result;
};

module.exports = { extractTextFromPDF, processExtractedText };