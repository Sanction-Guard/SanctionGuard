// src/services/importPDFService.js
import { extractAndProcessPDF } from './PDFService.js';
import { logger } from '../utils/logger.js';
import Import from '../models/Import.js';
import BlockListIndividual from '../models/BlockListIndividual.js';
import BlockListEntity from '../models/BlockListEntity.js';

/**
 * Process a PDF file for the import system and save to BlockList database
 * @param {string} filePath - Path to the PDF file
 * @param {string} importId - ID of the import record
 * @returns {Promise<number>} - Number of entries processed
 */
export const processImportPDF = async (filePath, importId) => {
    try {
        logger.info(`Processing PDF import: ${filePath} for import ID: ${importId}`);
        
        // Update import status to processing
        await Import.findByIdAndUpdate(importId, { status: 'processing' });
        
        // Use the existing PDF extraction functionality to get the data
        const result = await extractAndProcessPDF(filePath);
        
        // Get the filename from the import record
        const importRecord = await Import.findById(importId);
        const sourceFile = importRecord ? importRecord.filename : 'unknown';
        
        // Save the extracted data to the BlockList database
        const saveResult = await saveToBlocklistDatabase(result.individuals, result.entities, importId, sourceFile);
        
        // Calculate the total number of entries processed
        const entriesUpdated = saveResult.individualsCount + saveResult.entitiesCount;
        
        logger.info(`PDF processed with ${entriesUpdated} entries saved to BlockList for import ID: ${importId}`);
        
        // Update import status to completed
        await Import.findByIdAndUpdate(importId, { 
            status: 'completed',
            entriesUpdated
        });
        
        return entriesUpdated;
    } catch (error) {
        logger.error(`Error processing PDF for import: ${error.message}`);
        
        // Update import status to failed
        await Import.findByIdAndUpdate(importId, { 
            status: 'failed',
            processingError: error.message
        });
        
        throw error;
    }
};

/**
 * Save individuals and entities to the BlockList database
 * @param {Array} individuals - List of individuals to save
 * @param {Array} entities - List of entities to save
 * @param {string} importId - ID of the import record
 * @param {string} sourceFile - Name of the source file
 * @returns {Promise<Object>} - Count of saved records
 */
const saveToBlocklistDatabase = async (individuals, entities, importId, sourceFile) => {
    try {
        // Process individuals
        let individualsCount = 0;
        if (individuals && individuals.length > 0) {
            for (const individual of individuals) {
                // Map to BlockList individual schema
                const blockListIndividual = {
                    referenceNumber: individual.reference_number,
                    firstName: individual.firstName || '',
                    secondName: individual.secondName || '',
                    thirdName: individual.thirdName || '',
                    dateOfBirth: individual.dob || '',
                    nicNumber: individual.nic || '',
                    aliasNames: Array.isArray(individual.aka) ? individual.aka : [],
                    source: 'PDF Import',
                    sourceFile,
                    importId,
                    listType: 'Local Sanctions',
                    isActive: true
                };
                
                // Check if this individual already exists in BlockList
                const existingIndividual = await BlockListIndividual.findOne({
                    referenceNumber: blockListIndividual.referenceNumber
                });
                
                if (existingIndividual) {
                    // Update existing record
                    await BlockListIndividual.updateOne(
                        { _id: existingIndividual._id },
                        { 
                            $set: blockListIndividual,
                            $setOnInsert: { created: new Date() }
                        }
                    );
                    logger.info(`Updated BlockList individual: ${blockListIndividual.referenceNumber}`);
                } else {
                    // Create new record
                    const newIndividual = new BlockListIndividual(blockListIndividual);
                    await newIndividual.save();
                    logger.info(`Created new BlockList individual: ${blockListIndividual.referenceNumber}`);
                }
                
                individualsCount++;
            }
        }
        
        // Process entities
        let entitiesCount = 0;
        if (entities && entities.length > 0) {
            for (const entity of entities) {
                // Map to BlockList entity schema
                const blockListEntity = {
                    referenceNumber: entity.reference_number,
                    name: entity.name || '',
                    aliasNames: Array.isArray(entity.aka) ? entity.aka : [],
                    addresses: Array.isArray(entity.addresses) ? entity.addresses : [],
                    source: 'PDF Import',
                    sourceFile,
                    importId,
                    listType: 'Local Sanctions',
                    isActive: true
                };
                
                // Check if this entity already exists in BlockList
                const existingEntity = await BlockListEntity.findOne({
                    referenceNumber: blockListEntity.referenceNumber
                });
                
                if (existingEntity) {
                    // Update existing record
                    await BlockListEntity.updateOne(
                        { _id: existingEntity._id },
                        { 
                            $set: blockListEntity,
                            $setOnInsert: { created: new Date() }
                        }
                    );
                    logger.info(`Updated BlockList entity: ${blockListEntity.referenceNumber}`);
                } else {
                    // Create new record
                    const newEntity = new BlockListEntity(blockListEntity);
                    await newEntity.save();
                    logger.info(`Created new BlockList entity: ${blockListEntity.referenceNumber}`);
                }
                
                entitiesCount++;
            }
        }
        
        return {
            individualsCount,
            entitiesCount
        };
    } catch (error) {
        logger.error('Error saving to BlockList database:', error);
        throw error;
    }
};
