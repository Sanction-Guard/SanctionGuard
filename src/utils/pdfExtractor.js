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
 * Processes extracted text to filter and extract names and DOBs.
 * @param {string} text - Extracted text from the PDF.
 * @returns {Object[]} - List of objects containing names and DOBs.
 */
const processExtractedText = (text) => {
    //to split the input text into lines.
    const lines = text.split('\n');

    // Array to store extracted information
    const extractedData = [];

    // Regex pattern for extracting name (name written in original script is not included here)
    const nameRegex = /Name:\s*(.*)/i;

    // for DOB
    const dobRegex = /DOB:\s*(?:Approximately\s*|Between\s*)?(\d{1,2}\s*[A-Za-z]{3,}\.\s*\d{4}|\d{4}(?:\s*and\s*\d{4})?|\d{4}(?:-\d{2}-\d{2})?)/i; //add any other formats if you found.currently includes between,approximately,standalone year and dates in YYYY-MM-DD.
    // added format XXth Feb. 2023 (UN format)

    //Regex for Id formats.add if you found anymore than this.formatting regex should be more then enough.This includes "SSN", "National ID", "Ration Card", country names
    const idRegex = /(?:\b(?:National\s*ID|Ration\s*Card|SSN|NIN|Sudan|National\s*Identification)\b\s*[:]?\s*)?([A-Za-z]{0,3}\s*[\d-–/\\()]{6,})(?:\s*\((.*?)\))?/gi;


    // Iterate through lines
    lines.forEach(line => {
        const data = {};

        // Extract names
        const nameMatch = line.match(nameRegex);
        if (nameMatch) {
            data.names = nameMatch[1]
                .split(/\d+:\s*/) // Split by numbered prefixes (after n:))
                .map(name => name.trim())
                .filter(name => name.length > 0 && !name.includes('original script'));
        }

        // Extract DOB
        const dobMatch = line.match(dobRegex);
        if (dobMatch) {
            data.dob = dobMatch[1];
        }

        //matching id numbers
        const idmatch = line.match(idRegex);
        if (idmatch){
            data.id = idmatch[1];
        }

        if (Object.keys(data).length > 0) {
            extractedData.push(data);
        }
    });

    return extractedData;
};

module.exports = { extractTextFromPDF, processExtractedText };


//30.01.2025 : code is extracting ID,NAME and DOB.everthing is fine until data extraction.- Create APIs to upload and process PDF files.
//    - Include validation, error handling for unsupported file formats, and performance optimizations. These should be fulfilled.