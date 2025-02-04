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
 * Processes extracted text to filter and extract names, DOBs, NICs, and entities.
 * @param {string} text - Extracted text from the PDF.
 * @returns {Object} - Contains lists of individuals and entities.
 */
const processExtractedText = (text) => {
    // Split text into individual entries using reference numbers
    const entryRegex = /(EN\/CA\/\d{4}\/\d{2,}|IN\/CA\/\d{4}\/\d{2,})([\s\S]*?)(?=EN\/CA\/\d{4}\/\d{2,}|IN\/CA\/\d{4}\/\d{2,}|$)/g;
    const entries = [];
    let match;
    while ((match = entryRegex.exec(text)) !== null) {
        entries.push({
            reference: match[1],
            content: match[2].trim()
        });
    }

    const individuals = [];
    const entities = [];

    entries.forEach(({ reference, content }) => {
        // Check if the entry is an entity (starts with "EN")
        if (reference.startsWith("EN")) {
            const entityMatch = content.match(/Name:\s*([^\n]+)\s*(?:a\.k\.a\s+(.+?))?/is);
            if (entityMatch) {
                const name = entityMatch[1].trim();
                const aka = entityMatch[2]
                    ? entityMatch[2].split(/\s*,\s*|\s+a\.k\.a\s+/i)
                        .map(a => a.trim())
                        .filter(a => a)
                    : [];

                entities.push({
                    reference_number: reference,
                    name: name,
                    aka: aka
                });
            }
        } else if (reference.startsWith("IN")) {
            // Process individuals
            const individualEntry = {
                reference_number: reference,
                first_name: '',
                second_name: '',
                third_name: '',
                aka: [],
                dob: '',
                nic: ''
            };

            const nameMatch = content.match(/Name:\s*((?:.(?!a\.k\.a))*?)(?:\s+a\.k\.a\s+(.+?))?(?=\s+Title:)/is);
            if (nameMatch) {
                const nameParts = nameMatch[1].trim().split(/\s+/);
                individualEntry.first_name = nameParts[0] || '';
                individualEntry.second_name = nameParts[1] || '';
                individualEntry.third_name = nameParts.slice(2).join(' ') || '';

                if (nameMatch[2]) {
                    individualEntry.aka = nameMatch[2].split(/\s*,\s*|\s+a\.k\.a\s+/i)
                        .map(a => a.trim())
                        .filter(a => a);
                }
            }

            const dobMatch = content.match(/DOB:\s*(\d{2}[.-]\d{2}[.-]\d{4})/i);
            if (dobMatch) {
                individualEntry.dob = dobMatch[1].replace(/-/g, '.');
            }

            const nicMatch = content.match(/NIC:\s*([A-Z0-9]+)/i);
            if (nicMatch) {
                individualEntry.nic = nicMatch[1].toUpperCase();
            }

            individuals.push(individualEntry);
        }
    });

    return { individuals, entities };
};

module.exports = { extractTextFromPDF, processExtractedText };