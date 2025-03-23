// src/services/importCSVService.js
/**
 * Service for processing CSV imports into the BlockList database and Elasticsearch
 * This service handles the main logic for parsing, processing, and storing
 * imported CSV data. 
 * 
 * @author SanctionGuard Development Team
 * @version 2.0.0
 */

import fs from 'fs';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';
import { logger } from '../utils/logger.js';
import Import from '../models/Import.js';
import BlockListIndividual from '../models/BlockListIndividual.js';
import BlockListEntity from '../models/BlockListEntity.js';
// Import the separate Elasticsearch service for import operations
import importElasticsearchService from './importElasticsearchService.js';

/**
 * Process a CSV file for the import system and save to BlockList database
 * This is the main entry point for CSV processing called by the controller
 * 
 * @async
 * @param {string} filePath - Path to the CSV file on disk
 * @param {string} importId - ID of the import record in the database
 * @returns {Promise<number>} - Number of entries processed successfully
 */
export const processImportCSV = async (filePath, importId) => {
    try {
        // Log the start of processing
        logger.info(`Processing CSV import: ${filePath} for import ID: ${importId}`);
        
        // Update the import status to 'processing' to reflect current state
        await Import.findByIdAndUpdate(importId, { status: 'processing' });
        
        // Get the import record to retrieve the original filename
        const importRecord = await Import.findById(importId);
        // Use the original file name or 'unknown' if not available
        const sourceFile = importRecord ? importRecord.filename : 'unknown';
        
        // Process the CSV file and get the count of entries updated
        const entriesUpdated = await parseAndProcessCSV(filePath, importId, sourceFile);
        
        // Update the import status to 'completed' now that processing is done
        await Import.findByIdAndUpdate(importId, { 
            status: 'completed',
            entriesUpdated: entriesUpdated // Store the number of processed entries
        });
        
        // Return the count of entries updated
        return entriesUpdated;
    } catch (error) {
        // Log error details for troubleshooting
        logger.error(`Error processing CSV for import: ${error.message}`);
        
        // Update the import status to 'failed' and store the error message
        await Import.findByIdAndUpdate(importId, { 
            status: 'failed',
            processingError: error.message
        });
        
        // Rethrow the error for the controller to handle
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
    // Return a promise that resolves when processing is complete
    return new Promise((resolve, reject) => {
        // Array to store parsed CSV rows
        const results = [];
        
        // Create a read stream to efficiently process the file
        // and pipe it through the CSV parser to convert to objects
        createReadStream(filePath)
            .pipe(parse({
                columns: true,         // Use first row as column names
                skip_empty_lines: true, // Skip empty lines in the CSV
                trim: true             // Trim whitespace from values
            }))
            .on('data', (data) => {
                // Add each parsed row to our results array
                results.push(data);
            })
            .on('end', async () => {
                try {
                    // Log the number of rows parsed from the CSV
                    logger.info(`Parsed ${results.length} rows from CSV file`);
                    
                    // Check if the CSV has any data rows
                    if (results.length === 0) {
                        throw new Error('CSV file contains no data rows');
                    }
                    
                    // Check if the CSV has a valid structure with columns
                    const firstRow = results[0];
                    if (!firstRow || Object.keys(firstRow).length === 0) {
                        throw new Error('CSV file has invalid structure or missing columns');
                    }
                    
                    // Analyze the data to determine if it contains individuals or entities
                    const isIndividualData = detectIndividualData(results);
                    
                    // Initialize counter for processed records
                    let processedCount = 0;
                    
                    // Initialize connection to Elasticsearch before processing
                    // This is done once per file to ensure the connection is available
                    await importElasticsearchService.initializeElasticsearch();
                    
                    // Process based on the detected data type
                    if (isIndividualData) {
                        logger.info('Processing CSV as individual data');
                        processedCount = await processIndividualsToBlocklist(results, importId, sourceFile);
                    } else {
                        logger.info('Processing CSV as entity data');
                        processedCount = await processEntitiesToBlocklist(results, importId, sourceFile);
                    }
                    
                    logger.info(`Successfully processed ${processedCount} entries from CSV to BlockList`);
                    
                    // Clean up the temporary file to avoid disk space issues
                    try {
                        if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                            logger.info(`Deleted temporary file: ${filePath}`);
                        }
                    } catch (cleanupErr) {
                        // Log cleanup errors but don't fail the overall process
                        logger.error('Error cleaning up file:', cleanupErr);
                    }
                    
                    // Resolve the promise with the count of processed entries
                    resolve(processedCount);
                } catch (error) {
                    // Log processing errors and reject the promise
                    logger.error('Error processing CSV data:', error);
                    reject(error);
                }
            })
            .on('error', (error) => {
                // Handle errors from the CSV parsing
                logger.error('Error parsing CSV file:', error);
                reject(error);
            });
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
    // Default to individuals if the CSV is empty (shouldn't happen due to prior checks)
    if (rows.length === 0) return true;
    
    // Get the first row to analyze its structure
    const firstRow = rows[0];
    
    // Define column names that typically indicate individual data
    const individualIndicators = [
        'firstName', 'first_name', 'given_name', 'secondName', 'second_name', 
        'surname', 'dob', 'date_of_birth', 'nic', 'national_id'
    ];
    
    // Define column names that typically indicate entity data
    const entityIndicators = [
        'company_name', 'entity_name', 'companyName', 'entityName', 'organization'
    ];
    
    // Count how many individual indicators are present in the columns
    const individualMatches = individualIndicators.filter(field => 
        firstRow.hasOwnProperty(field)
    ).length;
    
    // Count how many entity indicators are present in the columns
    const entityMatches = entityIndicators.filter(field => 
        firstRow.hasOwnProperty(field)
    ).length;
    
    // Special case: If reference_number starts with IN/, it's definitely an individual
    if (firstRow.reference_number && firstRow.reference_number.startsWith('IN/')) {
        return true;
    }
    
    // Special case: If reference_number starts with EN/, it's definitely an entity
    if (firstRow.reference_number && firstRow.reference_number.startsWith('EN/')) {
        return false;
    }
    
    // Log the determination process for debugging
    logger.info(`Data type detection: Individual matches: ${individualMatches}, Entity matches: ${entityMatches}`);
    
    // Decide based on which type has more matching fields
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
    // Initialize counter for processed records
    let count = 0;
    // Array to collect processed individuals for bulk indexing to Elasticsearch
    let processedIndividuals = [];
    
    // Detect if the CSV uses local format or UN sanctions format
    // This affects how we map the fields
    const isLocalFormat = rows.length > 0 && (
        rows[0].hasOwnProperty('reference_number') && rows[0].reference_number?.startsWith('IN/CA/') || 
        rows[0].hasOwnProperty('dob') && rows[0].hasOwnProperty('nic')
    );
    
    logger.info(`CSV appears to be in ${isLocalFormat ? 'local' : 'UN'} format`);
    
    // Process each row in the CSV
    for (const row of rows) {
        try {
            // Map fields from CSV to BlockList individual schema
            const blockListIndividual = mapIndividualToBlocklist(row, count, importId, sourceFile, isLocalFormat);
            
            // Check if this individual already exists in BlockList
            const existingIndividual = await BlockListIndividual.findOne({
                referenceNumber: blockListIndividual.referenceNumber
            });
            
            let savedIndividual;
            
            if (existingIndividual) {
                // Update existing record with new data
                await BlockListIndividual.updateOne(
                    { _id: existingIndividual._id },
                    { 
                        $set: blockListIndividual,
                        $setOnInsert: { created: new Date() }
                    }
                );
                
                // Retrieve the updated record for Elasticsearch indexing
                savedIndividual = await BlockListIndividual.findById(existingIndividual._id);
                logger.info(`Updated BlockList individual: ${blockListIndividual.referenceNumber}`);
            } else {
                // Create new record for new individuals
                const newIndividual = new BlockListIndividual(blockListIndividual);
                savedIndividual = await newIndividual.save();
                logger.info(`Created new BlockList individual: ${blockListIndividual.referenceNumber}`);
            }
            
            // Add the saved individual to the batch for Elasticsearch indexing
            if (savedIndividual) {
                processedIndividuals.push(savedIndividual);
            }
            
            // Increment the processed count
            count++;
            
            // Bulk index in batches of 100 to optimize performance and memory usage
            if (processedIndividuals.length >= 100) {
                await importElasticsearchService.bulkIndex(processedIndividuals, 'individual');
                // Clear the array after indexing to free memory
                processedIndividuals = [];
            }
        } catch (error) {
            // Log errors but continue processing other rows
            logger.error(`Error processing individual from CSV (row ${count + 1}) to BlockList:`, error);
        }
    }
    
    // Index any remaining individuals (less than batch size)
    if (processedIndividuals.length > 0) {
        await importElasticsearchService.bulkIndex(processedIndividuals, 'individual');
    }
    
    // Return the total count of processed records
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
        // Process local format data
        
        // Format reference number if needed
        let refNumber = row.reference_number || '';
        if (!refNumber.match(/^IN\/CA\/\d{4}\/\d{2}$/)) {
            // Generate a reference number in the format IN/CA/YYYY/XX
            const year = new Date().getFullYear();
            refNumber = `IN/CA/${year}/${String(count).padStart(2, '0')}`;
        }
        
        // Extract name components with fallbacks
        let firstName = '', secondName = '', thirdName = '';
        if (row.name) {
            // If there's a single 'name' field, parse it into components
            const nameParts = row.name.split(' ');
            firstName = nameParts[0] || '';
            secondName = nameParts[1] || '';
            thirdName = nameParts.slice(2).join(' ') || '';
        } else {
            // Otherwise use specific name fields with fallbacks
            firstName = row.firstName || row.first_name || '';
            secondName = row.secondName || row.second_name || row.surname || '';
            thirdName = row.thirdName || row.third_name || '';
        }
        
        // Format DOB to match required format
        let dateOfBirth = row.dob || '';
        
        // Format NIC and ensure uppercase for consistency
        let nicNumber = row.nic || row.nic_number || row.national_id || '';
        if (nicNumber) {
            nicNumber = nicNumber.toUpperCase();
        }
        
        // Return the mapped individual object
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
            isActive: true,
            created: new Date() // Add creation date for tracking
        };
    } else {
        // Process UN format data - has different field structure
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
            isActive: true,
            created: new Date() // Add creation date for tracking
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
    // Initialize counter for processed records
    let count = 0;
    // Array to collect processed entities for bulk indexing to Elasticsearch
    let processedEntities = [];
    
    // Detect if the CSV uses local format or UN sanctions format
    const isLocalFormat = rows.length > 0 && (
        rows[0].hasOwnProperty('reference_number') && rows[0].reference_number?.startsWith('EN/CA/') ||
        rows[0].hasOwnProperty('addresses')
    );
    
    logger.info(`CSV appears to be in ${isLocalFormat ? 'local' : 'UN'} format for entities`);
    
    // Process each row in the CSV
    for (const row of rows) {
        try {
            // Map fields from CSV to BlockList entity schema
            const blockListEntity = mapEntityToBlocklist(row, count, importId, sourceFile, isLocalFormat);
            
            // Check if this entity already exists in BlockList by reference number
            const existingEntity = await BlockListEntity.findOne({
                referenceNumber: blockListEntity.referenceNumber
            });
            
            let savedEntity;
            
            if (existingEntity) {
                // Update existing record with new data
                await BlockListEntity.updateOne(
                    { _id: existingEntity._id },
                    { 
                        $set: blockListEntity,
                        $setOnInsert: { created: new Date() }
                    }
                );
                
                // Retrieve the updated record for Elasticsearch indexing
                savedEntity = await BlockListEntity.findById(existingEntity._id);
                logger.info(`Updated BlockList entity: ${blockListEntity.referenceNumber}`);
            } else {
                // Create new record for new entities
                const newEntity = new BlockListEntity(blockListEntity);
                savedEntity = await newEntity.save();
                logger.info(`Created new BlockList entity: ${blockListEntity.referenceNumber}`);
            }
            
            // Add the saved entity to the batch for Elasticsearch indexing
            if (savedEntity) {
                processedEntities.push(savedEntity);
            }
            
            // Increment the processed count
            count++;
            
            // Bulk index in batches of 100 to optimize performance and memory usage
            if (processedEntities.length >= 100) {
                await importElasticsearchService.bulkIndex(processedEntities, 'entity');
                // Clear the array after indexing to free memory
                processedEntities = [];
            }
        } catch (error) {
            // Log errors but continue processing other rows
            logger.error(`Error processing entity from CSV (row ${count + 1}) to BlockList:`, error);
        }
    }
    
    // Index any remaining entities (less than batch size)
    if (processedEntities.length > 0) {
        await importElasticsearchService.bulkIndex(processedEntities, 'entity');
    }
    
    // Return the total count of processed records
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
    // Return empty array if field is falsy
    if (!field) return [];
    
    // If field is already an array, return it as is
    if (Array.isArray(field)) return field;
    
    // Otherwise, treat as comma-separated string and convert to array
    // Split by comma, trim whitespace, and filter out empty entries
    return field.split(',').map(item => item.trim()).filter(item => item !== '');
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
        // Process local format data
        
        // Format reference number if needed
        let refNumber = row.reference_number || '';
        if (!refNumber.match(/^EN\/CA\/\d{4}\/\d{2}$/)) {
            // Generate a reference number in the format EN/CA/YYYY/XX
            const year = new Date().getFullYear();
            refNumber = `EN/CA/${year}/${String(count).padStart(2, '0')}`;
        }
        
        // Get entity name with fallbacks
        const name = row.name || row.entity_name || row.company_name || '';
        
        // Process addresses - handle different possible formats
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
        
        // Return the mapped entity object
        return {
            referenceNumber: refNumber,
            name: name,
            aliasNames: parseArrayField(row.aka || row.aliases || ''),
            addresses: addresses,
            source: 'CSV Import - Local',
            sourceFile,
            importId,
            listType: 'Local Sanctions',
            isActive: true,
            created: new Date() // Add creation date for tracking
        };
    } else {
        // Process UN format data - has different field structure
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
            isActive: true,
            created: new Date() // Add creation date for tracking
        };
    }
};

// Export the main function for use by importController
export default { processImportCSV };
