import fetch from 'node-fetch';
import { Parser } from 'xml2js';
import { UN_SANCTIONS_URL } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { extractValues, extractArrayField } from '../utils/extractor.js';
import { saveIndividualsToMongoDB, saveEntitiesToMongoDB } from '../jobs/dataSaver.js';

export const fetchAndParseXML = async () => {
    try {
        logger.info('Fetching XML data...');
        const response = await fetch(UN_SANCTIONS_URL);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const xml = await response.text();
        const parser = new Parser({ explicitArray: false });

        return new Promise((resolve, reject) => {
            parser.parseString(xml, (err, result) => {
                if (err) {
                    reject(new Error(`Error parsing XML: ${err.message}`));
                    return;
                }
                resolve(result);
            });
        });
    } catch (error) {
        logger.error('Error fetching XML:', error.message);
        throw error;
    }
};

export const processIndividuals = async(result) => {
    const individuals = result?.CONSOLIDATED_LIST?.INDIVIDUALS?.INDIVIDUAL;
    if (!individuals) {
        console.log('No individuals found in the XML.');
        return;
    }

    const individualsArray = Array.isArray(individuals) ? individuals : [individuals];
    console.log(`Processing ${individualsArray.length} individuals...`);

    for (const individual of individualsArray) {
        try {
            const individualData = {
                firstName: individual.FIRST_NAME || 'N/A',
                secondName: individual.SECOND_NAME || 'N/A',
                thirdName: individual.THIRD_NAME || 'N/A',
                unListType: individual.UN_LIST_TYPE || 'N/A',
                referenceNumber: individual.REFERENCE_NUMBER,
                title: extractValues(individual.TITLE),
                nationality: extractValues(individual.NATIONALITY),
                aliasNames: extractArrayField(individual.INDIVIDUAL_ALIAS, 'ALIAS_NAME'),
                addressCity: extractArrayField(individual.INDIVIDUAL_ADDRESS, 'CITY'),
                addressCountry: extractArrayField(individual.INDIVIDUAL_ADDRESS, 'COUNTRY'),
                dobYear: extractArrayField(individual.INDIVIDUAL_DATE_OF_BIRTH, 'YEAR'),
                birthCity: extractArrayField(individual.INDIVIDUAL_PLACE_OF_BIRTH, 'CITY'),
                birthCountry: extractArrayField(individual.INDIVIDUAL_PLACE_OF_BIRTH, 'COUNTRY'),
                docType: extractArrayField(individual.INDIVIDUAL_DOCUMENT, 'TYPE_OF_DOCUMENT'),
                docNumber: extractArrayField(individual.INDIVIDUAL_DOCUMENT, 'NUMBER'),
                docIssueCountry: extractArrayField(individual.INDIVIDUAL_DOCUMENT, 'COUNTRY_OF_ISSUE')
            };

            await saveIndividualsToMongoDB(individualData);
        } catch (error) {
            console.error(`Error processing individual: ${individual.FIRST_NAME}`, error);
            console.error('Data causing error:', JSON.stringify(individual, null, 2));
            continue;
        }
    }
}

export const processEntities = async(result) => {
    const entities = result?.CONSOLIDATED_LIST?.ENTITIES?.ENTITY;
    if (!entities) {
        console.log('No entities found in the XML.');
        return;
    }
    const entitiesArray = Array.isArray(entities) ? entities : [entities];
    console.log(`Processing ${entitiesArray.length} entities...`);

    for (const entity of entitiesArray) {
        try {
            const entityData = {
                firstName: entity.FIRST_NAME || 'N/A',
                unListType: entity.UN_LIST_TYPE || 'N/A',
                referenceNumber: entity.REFERENCE_NUMBER,
                aliasNames: extractArrayField(entity.ENTITY_ALIAS, 'ALIAS_NAME'),
                addressStreet: extractArrayField(entity.ENTITY_ADDRESS, 'STREET'),
                addressCity: extractArrayField(entity.ENTITY_ADDRESS, 'CITY'),
                addressCountry: extractArrayField(entity.ENTITY_ADDRESS, 'COUNTRY')
            };

            await saveEntitiesToMongoDB(entityData);
        } catch (error) {
            console.error(`Error processing individual: ${entity.FIRST_NAME}`, error);
            console.error('Data causing error:', JSON.stringify(entity, null, 2));
            continue;
        }
    }
}

