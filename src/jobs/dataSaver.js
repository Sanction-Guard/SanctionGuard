import { MONGO_URI } from '../config/database.js'
import Individual from '../models/Individuals.js';
import Entity from '../models/Entity.js';


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
export const saveIndividualsToMongoDB = async(individualData) => {
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
export const saveEntitiesToMongoDB = async(entityData) =>{
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