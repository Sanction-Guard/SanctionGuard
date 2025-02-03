const fs = require('fs');
const pdfParse = require('pdf-parse');

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
            name: '',
            aka: '',
            dob: '',
            nic: '',
            reference_number: reference
        };

        // Enhanced name extraction with multiple aliases
        const nameMatch = content.match(/Name:\s*((?:.(?!a\.k\.a))*?)(?:\s+a\.k\.a\s+(.+?))?(?=\s+Title:)/is);
        if (nameMatch) {
            entry.name = nameMatch[1].trim();
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

//03.02.2025 Updated and working fine