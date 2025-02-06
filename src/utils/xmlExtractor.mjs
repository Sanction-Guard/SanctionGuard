import fetch from 'node-fetch';
import { Parser } from 'xml2js';
import mongoose from 'mongoose';
import Individual from './Individuals.mjs';
import Entity from './Entities.mjs';
import cron from 'node-cron';

//MongoDB atlas credentials
const DB_USERNAME = 'SanctionGuard';
const DB_PASSWORD = 'SanctionGuard';
const DB_CLUSTER = 'sanctioncluster.2myce.mongodb.net';
const DB_NAME = 'UNSanction';

const MONGO_URI = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@${DB_CLUSTER}/${DB_NAME}?retryWrites=true&w=majority`;
const UN_SANCTIONS_URL = 'https://scsanctions.un.org/resources/xml/en/consolidated.xml';

//Adding the timestamp
function logWithTimestamp(message){
    const timestamp = new Date().toISOString();
    console.log(`time stamp : ${timestamp}, ${message}`);
}

async function runScheduledTask() {
    let connection = null;
    try {
        logWithTimestamp('Starting scheduled sync...');
        
        // Check database and resources first
        const resourcesOK = await checkDatabaseAndResources();
        if (!resourcesOK) {
            throw new Error('Database and resource check failed');
        }

        // Continue with existing flow
        await connectDB();
        connection = mongoose.connection;
        
        const result = await fetchAndParseXML();
        await processIndividuals(result);
        await processEntities(result);
        
        logWithTimestamp('Scheduled sync completed successfully');
    } catch (error) {
        logWithTimestamp(`Scheduled task error: ${error.message}`);
    } finally {
        if (connection) {
            await connection.close();
            logWithTimestamp('Database connection closed');
        }
    }
}



// Function to extract values 
function extractValues(field) {
    if (!field) return ['N/A'];
    
    // Handle when VALUE is already an array
    if (field.VALUE && Array.isArray(field.VALUE)) {
        return field.VALUE;
    }
    
    // Handle when VALUE is a single value
    if (field.VALUE) {
        return [field.VALUE];
    }
    
    return ['N/A'];
}

// Helper function to extract array of values from nested objects
function extractArrayField(field, key) {
    if (!field) return ['N/A'];
    
    // If field is an array of objects
    if (Array.isArray(field)) {
        const values = field.map(item => item[key] || 'N/A').filter(val => val !== '');
        return values.length > 0 ? values : ['N/A'];
    }
    
    // If field is a single object
    if (field[key]) {
        return [field[key]];
    }
    
    return ['N/A'];
}

//
//
async function checkDatabaseAndResources() {
    try {
        // Check database connection
        await mongoose.connect(MONGO_URI);
        console.log('Database connection check: SUCCESS');

        // Check if collections exist
        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(col => col.name);
        
        console.log('Available collections:', collectionNames);

        // Check if our models' collections exist
        const requiredCollections = ['individuals', 'entities'];
        const missingCollections = requiredCollections.filter(col => !collectionNames.includes(col));
        
        if (missingCollections.length > 0) {
            console.log('Missing collections:', missingCollections);
            // Create missing collections
            for (const colName of missingCollections) {
                await mongoose.connection.db.createCollection(colName);
                console.log(`Created collection: ${colName}`);
            }
        }

        return true;
    } catch (error) {
        console.error('Database and resource check failed:', error.message);
        return false;
    }
}

// function to find new individuals
async function findNewIndividuals(individualData) {
    try {
        const existing = await Individual.findOne({
            // firstName: individualData.firstName,
            // secondName: individualData.secondName,
            referenceNumber: individualData.referenceNumber,
            aliasNames: individualData.aliasNames,
            dobYear: individualData.dobYear,
            docType: individualData.docType,
            docNumber: individualData.docNumber
        });
        return !existing;
    } catch (error) {
        console.error('Error checking for existing individual:', error.message);
        return false;
    }
}

// function to find new entities
async function findNewEntities(entityData) {
    try {
        const existing = await Entity.findOne({
            firstName: entityData.firstName,
            referenceNumber: entityData.referenceNumber
        });
        return !existing;
    } catch (error) {
        console.error('Error checking for existing entity:', error.message);
        return false;
    }
}

// function to establish the connection between the backend and the database
async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB Atlas successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        throw error;
    }
}

//Function to save the data of individuals to the database
async function saveIndividualsToMongoDB(individualData) {
    try {
        const isNew = await findNewIndividuals(individualData);
        if (isNew) {
            const individual = new Individual(individualData);
            await individual.save();
            console.log(`Saved new individual: ${individual.firstName} ${individual.secondName}`);
        } else {
            console.log(`Skipped existing individual: ${individualData.firstName} ${individualData.secondName}`);
        }
    } catch (error) {
        console.error(`Error saving individual ${individualData.firstName} ${individualData.secondName}:`, error.message);
        throw error;
    }
}

//Function to save the data of entities to the database
async function saveEntitiesToMongoDB(entityData){
    try {
        const isNew = await findNewEntities(entityData);
        if (isNew) {
            const entity = new Entity(entityData);
            await entity.save();
            console.log(`Saved new entity: ${entity.firstName}`);
        } else {
            console.log(`Skipped existing entity: ${entityData.firstName}`);
        }
    } catch (error) {
        console.error(`Error saving entity ${entityData.firstName}:`, error.message);
        throw error;
    }
}

async function fetchAndParseXML() {
    try {
        console.log('Fetching XML data...');
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
        console.error('Error fetching XML:', error.message);
        throw error;
    }
}

async function processIndividuals(result) {
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
                referenceNumber: individual.REFERENCE_NUMBER || 'N/A',
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

async function processEntities(result){
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
                referenceNumber: entity.REFERENCE_NUMBER || 'N/A',
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

//function to start the scheduler
function startScheduler() {
    logWithTimestamp('Starting scheduler...');
    
    // Schedule task to run per day
    cron.schedule('*/20 * * * *', async () => {
        logWithTimestamp('Running scheduled task...');
        await runScheduledTask();
    });
    
    // Run immediately on startup
    runScheduledTask();
    
    // Keep the process running
    process.on('SIGINT', async () => {
        logWithTimestamp('Shutting down scheduler...');
        await mongoose.connection.close();
        process.exit(0);
    });
}

async function main() {
    try {
        startScheduler();
    } catch (error) {
        console.error('Application error:', error.message);
        process.exit(1);
    }
    // } finally {
    //     await mongoose.connection.close();
    // }
}

// Run the application
main();