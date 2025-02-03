import fetch from 'node-fetch';
import { Parser } from 'xml2js';

// URL of the UN Sanctions List XML file
const url = 'https://scsanctions.un.org/resources/xml/en/consolidated.xml';

/**
 * Fetches and parses the UN sanctions list from an XML source.
 * Extracts relevant details about individuals and logs them to the console.
 */
async function fetchAndParseXML() {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const xml = await response.text();
        const parser = new Parser({ explicitArray: false });

        parser.parseString(xml, (err, result) => {
            if (err) {
                console.error('Error parsing XML:', err);
                return;
            }

            // Ensure the consolidated list exists
            const individuals = result?.CONSOLIDATED_LIST?.INDIVIDUALS?.INDIVIDUAL;

            if (!individuals) {
                console.log('No individuals found in the XML.');
                return;
            }

            // Convert to array if it's not already
            const individualsArray = Array.isArray(individuals) ? individuals : [individuals];

            individualsArray.forEach((individual, index) => {
                const firstName = individual.FIRST_NAME || 'N/A';
                const secondName = individual.SECOND_NAME || 'N/A';
                const thirdName = individual.THIRD_NAME || 'N/A';
                const unListType = individual.UN_LIST_TYPE || 'N/A';
                const referenceNumber = individual.REFERENCE_NUMBER || 'N/A';

                // Check if TITLE exists and handle it as an array
                const titleArray = individual.TITLE ? (Array.isArray(individual.TITLE) ? individual.TITLE : [individual.TITLE]) : [];
                const titleName = titleArray.length > 0 ? titleArray.map(t => t.VALUE).join(', ') : 'N/A';

                // Handle NATIONALITY
                const nationalityArray = individual.NATIONALITY ? (Array.isArray(individual.NATIONALITY) ? individual.NATIONALITY : [individual.NATIONALITY]) : [];
                const nation = nationalityArray.length > 0 ? nationalityArray.map(n => n.VALUE).join(', ') : 'N/A';

                // Handle ALIAS as an array
                const aliasArray = individual.INDIVIDUAL_ALIAS ? (Array.isArray(individual.INDIVIDUAL_ALIAS) ? individual.INDIVIDUAL_ALIAS : [individual.INDIVIDUAL_ALIAS]) : [];
                const aliasNames = aliasArray.map(a => a.ALIAS_NAME || 'N/A').join(', ');

                // Handle ADDRESS
                const addressArray = individual.INDIVIDUAL_ADDRESS ? (Array.isArray(individual.INDIVIDUAL_ADDRESS) ? individual.INDIVIDUAL_ADDRESS : [individual.INDIVIDUAL_ADDRESS]) : [];
                const addressCity = addressArray.length > 0 ? addressArray.map(a => a.CITY || 'N/A').join(', ') : 'N/A';
                const addressCountry = addressArray.length > 0 ? addressArray.map(a => a.COUNTRY || 'N/A').join(', ') : 'N/A';

                // Handle Date of Birth
                const dobArray = individual.INDIVIDUAL_DATE_OF_BIRTH ? (Array.isArray(individual.INDIVIDUAL_DATE_OF_BIRTH) ? individual.INDIVIDUAL_DATE_OF_BIRTH : [individual.INDIVIDUAL_DATE_OF_BIRTH]) : [];
                const dobYear = dobArray.length > 0 ? dobArray.map(d => d.YEAR || 'N/A').join(', ') : 'N/A';

                // Handle Place of Birth
                const birthPlaceArray = individual.INDIVIDUAL_PLACE_OF_BIRTH ? (Array.isArray(individual.INDIVIDUAL_PLACE_OF_BIRTH) ? individual.INDIVIDUAL_PLACE_OF_BIRTH : [individual.INDIVIDUAL_PLACE_OF_BIRTH]) : [];
                const birthCity = birthPlaceArray.length > 0 ? birthPlaceArray.map(b => b.CITY || 'N/A').join(', ') : 'N/A';
                const birthCountry = birthPlaceArray.length > 0 ? birthPlaceArray.map(b => b.COUNTRY || 'N/A').join(', ') : 'N/A';

                // Handle Document
                const documentArray = individual.INDIVIDUAL_DOCUMENT ? (Array.isArray(individual.INDIVIDUAL_DOCUMENT) ? individual.INDIVIDUAL_DOCUMENT : [individual.INDIVIDUAL_DOCUMENT]) : [];
                const docType = documentArray.length > 0 ? documentArray.map(d => d.TYPE_OF_DOCUMENT || 'N/A').join(', ') : 'N/A';
                const docNumber = documentArray.length > 0 ? documentArray.map(d => d.NUMBER || 'N/A').join(', ') : 'N/A';
                const docIssueCountry = documentArray.length > 0 ? documentArray.map(d => d.COUNTRY_OF_ISSUE || d.ISSUING_COUNTRY || 'N/A').join(', ') : 'N/A';

                // Log the extracted details to the console
                console.log(`
                Individual ${index + 1}:
                First Name: ${firstName}
                Second Name: ${secondName}
                Third Name: ${thirdName}
                UN List Type: ${unListType}
                Reference Number: ${referenceNumber}
                Title: ${titleName}
                Nationality: ${nation}
                Alias Names: ${aliasNames}
                Address - City: ${addressCity}
                Address - Country: ${addressCountry}
                Date of Birth (Year): ${dobYear}
                Birthplace - City: ${birthCity}
                Birthplace - Country: ${birthCountry}
                Document Type: ${docType}
                Document Number: ${docNumber}
                Document Issued By: ${docIssueCountry}
                `);
            });
        });

    } catch (error) {
        console.error('Error fetching XML:', error);
    }
}

fetchAndParseXML();
