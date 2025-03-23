// src/services/importCSVService.js
/**
 * Service for processing CSV imports into the BlockList database
 * This service handles the main logic for parsing, processing, and storing
 * imported CSV data. 
 * 
 * @author SanctionGuard Development Team
 */

import fs from 'fs';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { logger } from '../utils/logger.js';
import Import from '../models/Import.js';
import BlockListIndividual from '../models/BlockListIndividual.js';
import BlockListEntity from '../models/BlockListEntity.js';
// Import the Elasticsearch service for optional indexing
import importElasticsearchService from './importElasticsearchService.js';

/**
 * Process a CSV file for the import system and save to BlockList database
 * This is the main entry point for CSV processing
 * 
 * @async
 * @param {string} filePath - Path to the CSV file
 * @param {string} importId - ID of the import record
 * @returns {Promise<number>} - Number of entries processed
 */
export const processImportCSV = async (filePath, importId) => {
    try {
        logger.info(`Processing CSV import: ${filePath} for import ID: ${importId}`);
        
        // Update import status to processing
        await Import.findByIdAndUpdate(importId, { status: 'processing' });
        
        // Get the import record to get the filename
        const importRecord = await Import.findById(importId);
        const sourceFile = importRecord ? importRecord.filename : 'unknown';
        
        // Process the CSV file
        const entriesUpdated = await parseAndProcessCSV(filePath, importId, sourceFile);
        
        // Update import status to completed
        await Import.findByIdAndUpdate(importId, { 
            status: 'completed',
            entriesUpdated
        });
        
        return entriesUpdated;
    } catch (error) {
        logger.error(`Error processing CSV for import: ${error.message}`);
        
        // Update import status to failed
        await Import.findByIdAndUpdate(importId, { 
            status: 'failed',
            processingError: error.message
        });
        
        throw error;
    }
};

/**
 * Parse and process a CSV file and save to BlockList database
 * Reads the CSV file, determines the data type, and processes accordingly
 * 
 * @async
 * @param {string} filePath - Path to the CSV file
 * @param {string} importId - ID of the import record
 * @param {string} sourceFile - Name of the source file
 * @returns {Promise<number>} - Number of entries processed
 */
const parseAndProcessCSV = async (filePath, importId, sourceFile) => {
    return new Promise((resolve, reject) => {
        const results = [];
        
        // Create a read stream and parse the CSV
        const parser = parse({
            columns: true,          // Use first row as column names
            skip_empty_lines: true, // Skip empty lines in the CSV
            trim: true,             // Trim whitespace from values
            relax_column_count: true, // Allow inconsistent column counts
            relax_quotes: true,     // Be more forgiving of quote issues
            skip_records_with_error: true // Skip malformed records
        });
        
        // Handle parsing errors
        parser.on('error', (error) => {
            logger.error(`Error parsing CSV file: ${error.message}`);
            reject(new Error(`Failed to parse CSV file: ${error.message}`));
        });
        
        // Process each row
        parser.on('readable', () => {
            let record;
            while ((record = parser.read()) !== null) {
                // Skip completely empty rows
                if (Object.keys(record).length > 0) {
                    results.push(record);
                }
            }
        });
        
        // Process end of file
        parser.on('end', async () => {
            try {
                logger.info(`Parsed ${results.length} rows from CSV file`);
                
                // Perform basic validation on the CSV data
                if (results.length === 0) {
                    throw new Error('CSV file contains no data rows');
                }
                
                // Check if the first row has expected columns
                const firstRow = results[0];
                if (!firstRow || Object.keys(firstRow).length === 0) {
                    throw new Error('CSV file has invalid structure or missing columns');
                }
                
                // Determine if this is individual or entity data
                const isIndividualData = detectIndividualData(results);
                
                let processedCount = 0;
                
                // Initialize Elasticsearch (but don't fail if it doesn't work)
                try {
                    await importElasticsearchService.initializeElasticsearch();
                    logger.info('Elasticsearch initialized for importing');
                } catch (esError) {
                    logger.warn(`Elasticsearch initialization failed (will continue without indexing): ${esError.message}`);
                }
                
                // Process based on data type
                if (isIndividualData) {
                    logger.info('Processing CSV as individual data');
                    processedCount = await processIndividualsToBlocklist(results, importId, sourceFile);
                } else {
                    logger.info('Processing CSV as entity data');
                    processedCount = await processEntitiesToBlocklist(results, importId, sourceFile);
                }
                
                logger.info(`Successfully processed ${processedCount} entries from CSV to BlockList`);
                
                // Clean up the temp file
                try {
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                        logger.info(`Deleted temporary file: ${filePath}`);
                    }
                } catch (cleanupErr) {
                    logger.error('Error cleaning up file:', cleanupErr);
                }
                
                resolve(processedCount);
            } catch (error) {
                logger.error('Error processing CSV data:', error);
                reject(error);
            }
        });
        
        // Create read stream and pipe to parser
        const fileStream = createReadStream(filePath);
        fileStream.on('error', (error) => {
            logger.error(`Error reading file: ${error.message}`);
            reject(new Error(`Error reading file: ${error.message}`));
        });
        
        fileStream.pipe(parser);
    });
};

/**
 * Detect if CSV contains individual data (as opposed to entity data)
 * Uses heuristics based on column names to determine data type
 * 
 * @param {Array} rows - CSV data rows
 * @returns {boolean} - True if data appears to be for individuals
 */
const detectIndividualData = (rows) => {
    if (rows.length === 0) return true; // Default to individuals if empty
    
    const firstRow = rows[0];
    
    // Check for typical individual fields
    const individualIndicators = [
        'firstName', 'first_name', 'given_name', 'secondName', 'second_name', 
        'surname', 'dob', 'date_of_birth', 'nic', 'national_id'
    ];
    
    // Check for typical entity fields
    const entityIndicators = [
        'company_name', 'entity_name', 'companyName', 'entityName', 'organization'
    ];
    
    // Count matches for both types
    const individualMatches = individualIndicators.filter(field => 
        firstRow.hasOwnProperty(field)
    ).length;
    
    const entityMatches = entityIndicators.filter(field => 
        firstRow.hasOwnProperty(field)
    ).length;
    
    // If reference_number starts with IN/, it's an individual
    if (firstRow.reference_number && firstRow.reference_number.startsWith('IN/')) {
        return true;
    }
    
    // If reference_number starts with EN/, it's an entity
    if (firstRow.reference_number && firstRow.reference_number.startsWith('EN/')) {
        return false;
    }
    
    // Log the determination for debugging
    logger.info(`Data type detection: Individual matches: ${individualMatches}, Entity matches: ${entityMatches}`);
    
    // Otherwise decide based on the number of matching fields
    return individualMatches >= entityMatches;
};

/**
 * Process individual records from CSV data to BlockList database
 * Maps CSV data to BlockList database schema and saves
 * 
 * @async
 * @param {Array} rows - CSV data rows
 * @param {string} importId - ID of the import record
 * @param {string} sourceFile - Name of the source file
 * @returns {Promise<number>} - Number of individuals processed
 */
const processIndividualsToBlocklist = async (rows, importId, sourceFile) => {
    let count = 0;
    let processedIndividuals = []; // Array to collect processed individuals for bulk indexing
    
    // Detect if the CSV is for UN sanctions format or local format
    const isLocalFormat = rows.length > 0 && (
        rows[0].hasOwnProperty('reference_number') && rows[0].reference_number?.startsWith('IN/CA/') || 
        rows[0].hasOwnProperty('dob') && rows[0].hasOwnProperty('nic')
    );
    
    logger.info(`CSV appears to be in ${isLocalFormat ? 'local' : 'UN'} format`);
    
    for (const row of rows) {
        try {
            // Skip rows with no valid data
            if (!row || Object.keys(row).filter(key => row[key]).length === 0) {
                continue;
            }
            
            // Map fields from CSV to BlockList individual schema
            const blockListIndividual = mapIndividualToBlocklist(row, count, importId, sourceFile, isLocalFormat);
            
            // Check if this individual already exists in BlockList
            let existingIndividual;
            try {
                existingIndividual = await BlockListIndividual.findOne({
                    referenceNumber: blockListIndividual.referenceNumber
                });
            } catch (findError) {
                logger.error(`Error finding existing individual: ${findError.message}`);
                // Continue with assumption that it's a new record
            }
            
            let savedIndividual;
            
            if (existingIndividual) {
                // Update existing record
                try {
                    await BlockListIndividual.updateOne(
                        { _id: existingIndividual._id },
                        { 
                            $set: blockListIndividual,
                            $setOnInsert: { created: new Date() }
                        }
                    );
                    
                    savedIndividual = await BlockListIndividual.findById(existingIndividual._id);
                    logger.info(`Updated BlockList individual: ${blockListIndividual.referenceNumber}`);
                } catch (updateError) {
                    logger.error(`Error updating individual: ${updateError.message}`);
                    // Continue with next record
                    continue;
                }
            } else {
                // Create new record
                try {
                    const newIndividual = new BlockListIndividual(blockListIndividual);
                    savedIndividual = await newIndividual.save();
                    logger.info(`Created new BlockList individual: ${blockListIndividual.referenceNumber}`);
                } catch (saveError) {
                    logger.error(`Error saving new individual: ${saveError.message}`);
                    // Continue with next record
                    continue;
                }
            }
            
            // Add the processed individual to the array for bulk indexing
            if (savedIndividual) {
                processedIndividuals.push(savedIndividual);
            }
            
            count++;
            
            // Bulk index in batches of 100 to avoid memory issues
            if (processedIndividuals.length >= 100) {
                try {
                    await importElasticsearchService.bulkIndex(processedIndividuals, 'individual');
                } catch (indexError) {
                    logger.error(`Elasticsearch indexing error (continuing anyway): ${indexError.message}`);
                }
                processedIndividuals = []; // Clear the array after indexing
            }
        } catch (error) {
            logger.error(`Error processing individual from CSV (row ${count + 1}) to BlockList:`, error);
            // Continue processing other rows
        }
    }
    
    // Index any remaining individuals
    if (processedIndividuals.length > 0) {
        try {
            await importElasticsearchService.bulkIndex(processedIndividuals, 'individual');
        } catch (indexError) {
            logger.error(`Elasticsearch indexing error (continuing anyway): ${indexError.message}`);
        }
    }
    
    return count;
};

/**
 * Map CSV row data to BlockList individual schema
 * Converts CSV column data to the structure required by the database
 * 
 * @param {Object} row - CSV row data
 * @param {number} count - Counter for generating reference numbers
 * @param {string} importId - ID of the import record
 * @param {string} sourceFile - Name of the source file
 * @param {boolean} isLocalFormat - Whether the data is in local format
 * @returns {Object} - BlockList individual data
 */
const mapIndividualToBlocklist = (row, count, importId, sourceFile, isLocalFormat) => {
    if (isLocalFormat) {
        // Format reference number if needed
        let refNumber = row.reference_number || '';
        if (!refNumber.match(/^IN\/CA\/\d{4}\/\d{2}$/)) {
            // Generate a reference number in the format IN/CA/YYYY/XX
            const year = new Date().getFullYear();
            refNumber = `IN/CA/${year}/${String(count).padStart(2, '0')}`;
        }
        
        // Extract name components
        let firstName = '', secondName = '', thirdName = '';
        if (row.name) {
            const nameParts = row.name.split(' ');
            firstName = nameParts[0] || '';
            secondName = nameParts[1] || '';
            thirdName = nameParts.slice(2).join(' ') || '';
        } else {
            firstName = row.firstName || row.first_name || '';
            secondName = row.secondName || row.second_name || row.surname || '';
            thirdName = row.thirdName || row.third_name || '';
        }
        
        // Format DOB to match required format
        let dateOfBirth = row.dob || '';
        
        // Format NIC
        let nicNumber = row.nic || row.nic_number || row.national_id || '';
        if (nicNumber) {
            nicNumber = nicNumber.toUpperCase();
        }
        
        return {
            referenceNumber: refNumber,
            firstName: firstName,
            secondName: secondName,
            thirdName: thirdName,
            dateOfBirth: dateOfBirth,
            nicNumber: nicNumber,
            aliasNames: parseArrayField(row.aka || row.aliases || ''),
            source: 'CSV Import - Local',
            sourceFile,
            importId,
            listType: 'Local Sanctions',
            isActive: true
        };
    } else {
        // UN format
        return {
            referenceNumber: row.referenceNumber || row.reference_number || row.ref || row.id || `CSV-${Date.now()}-${count}`,
            firstName: row.firstName || row.first_name || row.given_name || row.givenName || row.name?.split(' ')[0] || '',
            secondName: row.secondName || row.second_name || row.family_name || row.familyName || row.surname || 
                        (row.name?.split(' ').length > 1 ? row.name.split(' ')[1] : '') || '',
            thirdName: row.thirdName || row.third_name || row.middle_name || row.middleName || '',
            aliasNames: parseArrayField(row.alias || row.aliases || row.aka || row.also_known_as || ''),
            title: parseArrayField(row.title || row.titles || ''),
            nationality: parseArrayField(row.nationality || row.nationalities || row.country || ''),
            addressCity: parseArrayField(row.city || row.cities || ''),
            addressCountry: parseArrayField(row.country || row.countries || ''),
            dobYear: parseArrayField(row.dob || row.date_of_birth || row.birth_date || row.yearOfBirth || ''),
            birthCity: parseArrayField(row.birthCity || row.birth_city || row.cityOfBirth || row.city_of_birth || ''),
            birthCountry: parseArrayField(row.birthCountry || row.birth_country || row.countryOfBirth || row.country_of_birth || ''),
            docType: parseArrayField(row.docType || row.doc_type || row.documentType || row.document_type || ''),
            docNumber: parseArrayField(row.docNumber || row.doc_number || row.documentNumber || row.document_number || ''),
            docIssueCountry: parseArrayField(row.docIssueCountry || row.doc_issue_country || row.documentIssueCountry || row.document_issue_country || ''),
            source: 'CSV Import - UN',
            sourceFile,
            importId,
            listType: 'UN Sanctions',
            isActive: true
        };
    }
};

/**
 * Process entity records from CSV data to BlockList database
 * Maps CSV data to BlockList database schema and saves
 * 
 * @async
 * @param {Array} rows - CSV data rows
 * @param {string} importId - ID of the import record
 * @param {string} sourceFile - Name of the source file
 * @returns {Promise<number>} - Number of entities processed
 */
const processEntitiesToBlocklist = async (rows, importId, sourceFile) => {
    let count = 0;
    let processedEntities = []; // Array to collect processed entities for bulk indexing
    
    // Detect if the CSV is for UN sanctions format or local format
    const isLocalFormat = rows.length > 0 && (
        rows[0].hasOwnProperty('reference_number') && rows[0].reference_number?.startsWith('EN/CA/') ||
        rows[0].hasOwnProperty('addresses')
    );
    
    logger.info(`CSV appears to be in ${isLocalFormat ? 'local' : 'UN'} format for entities`);
    
    for (const row of rows) {
        try {
            // Skip rows with no valid data
            if (!row || Object.keys(row).filter(key => row[key]).length === 0) {
                continue;
            }
            
            // Map fields from CSV to BlockList entity schema
            const blockListEntity = mapEntityToBlocklist(row, count, importId, sourceFile, isLocalFormat);
            
            // Check if this entity already exists in BlockList
            let existingEntity;
            try {
                existingEntity = await BlockListEntity.findOne({
                    referenceNumber: blockListEntity.referenceNumber
                });
            } catch (findError) {
                logger.error(`Error finding existing entity: ${findError.message}`);
                // Continue with assumption that it's a new record
            }
            
            let savedEntity;
            
            if (existingEntity) {
                // Update existing record
                try {
                    await BlockListEntity.updateOne(
                        { _id: existingEntity._id },
                        { 
                            $set: blockListEntity,
                            $setOnInsert: { created: new Date() }
                        }
                    );
                    
                    savedEntity = await BlockListEntity.findById(existingEntity._id);
                    logger.info(`Updated BlockList entity: ${blockListEntity.referenceNumber}`);
                } catch (updateError) {
                    logger.error(`Error updating entity: ${updateError.message}`);
                    // Continue with next record
                    continue;
                }
            } else {
                // Create new record
                try {
                    const newEntity = new BlockListEntity(blockListEntity);
                    savedEntity = await newEntity.save();
                    logger.info(`Created new BlockList entity: ${blockListEntity.referenceNumber}`);
                } catch (saveError) {
                    logger.error(`Error saving new entity: ${saveError.message}`);
                    // Continue with next record
                    continue;
                }
            }
            
            // Add the processed entity to the array for bulk indexing
            if (savedEntity) {
                processedEntities.push(savedEntity);
            }
            
            count++;
            
            // Bulk index in batches of 100 to avoid memory issues
            if (processedEntities.length >= 100) {
                try {
                    await importElasticsearchService.bulkIndex(processedEntities, 'entity');
                } catch (indexError) {
                    logger.error(`Elasticsearch indexing error (continuing anyway): ${indexError.message}`);
                }
                processedEntities = []; // Clear the array after indexing
            }
        } catch (error) {
            logger.error(`Error processing entity from CSV (row ${count + 1}) to BlockList:`, error);
            // Continue processing other rows
        }
    }
    
    // Index any remaining entities
    if (processedEntities.length > 0) {
        try {
            await importElasticsearchService.bulkIndex(processedEntities, 'entity');
        } catch (indexError) {
            logger.error(`Elasticsearch indexing error (continuing anyway): ${indexError.message}`);
        }
    }
    
    return count;
};

/**
 * Parse a field that might be an array or comma-separated string
 * Handles different formats of data that represent lists
 * 
 * @param {string|Array} field - Field to parse
 * @returns {Array} - Array of values
 */
const parseArrayField = (field) => {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    
    try {
        // Handle comma-separated values
        return field.split(',').map(item => item.trim()).filter(item => item !== '');
    } catch (error) {
        logger.error(`Error parsing array field:`, error);
        return [];
    }
};

/**
 * Map CSV row data to BlockList entity schema
 * Converts CSV column data to the structure required by the database
 * 
 * @param {Object} row - CSV row data
 * @param {number} count - Counter for generating reference numbers
 * @param {string} importId - ID of the import record
 * @param {string} sourceFile - Name of the source file
 * @param {boolean} isLocalFormat - Whether the data is in local format
 * @returns {Object} - BlockList entity data
 */
const mapEntityToBlocklist = (row, count, importId, sourceFile, isLocalFormat) => {
    if (isLocalFormat) {
        // Format reference number if needed
        let refNumber = row.reference_number || '';
        if (!refNumber.match(/^EN\/CA\/\d{4}\/\d{2}$/)) {
            // Generate a reference number in the format EN/CA/YYYY/XX
            const year = new Date().getFullYear();
            refNumber = `EN/CA/${year}/${String(count).padStart(2, '0')}`;
        }
        
        // Get entity name
        const name = row.name || row.entity_name || row.company_name || '';
        
        // Process addresses
        let addresses = [];
        if (row.addresses) {
            // If addresses is already an array or comma-separated string
            addresses = parseArrayField(row.addresses);
        } else if (row.address) {
            // If there's a single address field
            addresses = [row.address];
        } else if (row.street || row.city || row.country) {
            // Try to construct address from components
            const addressParts = [];
            if (row.street) addressParts.push(row.street);
            if (row.city) addressParts.push(row.city);
            if (row.country) addressParts.push(row.country);
            
            if (addressParts.length > 0) {
                addresses = [addressParts.join(', ')];
            }
        }
        
        return {
            referenceNumber: refNumber,
            name: name,
            aliasNames: parseArrayField(row.aka || row.aliases || ''),
            addresses: addresses,
            source: 'CSV Import - Local',
            sourceFile,
            importId,
            listType: 'Local Sanctions',
            isActive: true
        };
    } else {
        // UN format
        return {
            referenceNumber: row.referenceNumber || row.reference_number || row.ref || row.id || `CSV-${Date.now()}-${count}`,
            name: row.name || row.entity_name || row.entityName || row.company_name || row.companyName || '',
            aliasNames: parseArrayField(row.alias || row.aliases || row.aka || row.also_known_as || ''),
            addressStreet: parseArrayField(row.street || row.address || row.street_address || ''),
            addressCity: parseArrayField(row.city || row.cities || ''),
            addressCountry: parseArrayField(row.country || row.countries || ''),
            source: 'CSV Import - UN',
            sourceFile,
            importId,
            listType: 'UN Sanctions',
            isActive: true
        };
    }
};

// Export the processImportCSV function for use by the controller
export default { processImportCSV };