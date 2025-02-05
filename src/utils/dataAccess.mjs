import { MongoClient } from 'mongodb';

const DB_USERNAME = 'SanctionGuard';
const DB_PASSWORD = 'SanctionGuard';
const DB_CLUSTER = 'sanctioncluster.2myce.mongodb.net';

const uri = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@${DB_CLUSTER}/test?retryWrites=true&w=majority`;
const client = new MongoClient(uri);

async function queryMultipleDatabases(searchName) {
    try {
        await client.connect();

        // First Database
        const unSanctionDb = client.db('UNSanction');
        // Second Database
        const secondDb = client.db('LocalSanction');  // Replace with your second database name

        // Collections from both databases
        const collections = {
            unSanction: {
                individuals: unSanctionDb.collection('individuals'),
                entities: unSanctionDb.collection('entities')
            },
            secondDb: {
                individuals: secondDb.collection('individuals'),
                entities: secondDb.collection('entities')
            }
        };

        const nameRegex = new RegExp(searchName, 'i');

        const query = {
            $or: [
                { firstName: { $regex: nameRegex } },
                { secondName: { $regex: nameRegex } },
                { thirdName: { $regex: nameRegex } },
                { aliasNames: { $regex: nameRegex } }
            ]
        };

        // Execute queries on all collections simultaneously
        const [
            unSanctionIndividuals,
            unSanctionEntities,
            secondDbIndividuals,
            secondDbEntities
        ] = await Promise.all([
            collections.unSanction.individuals.find(query).toArray(),
            collections.unSanction.entities.find(query).toArray(),
            collections.secondDb.individuals.find(query).toArray(),
            collections.secondDb.entities.find(query).toArray()
        ]);

        // Process results from UNSanction database
        console.log('\nResults from UNSanction database:');
        console.log('Individuals collection:');
        console.log(`Total documents found: ${unSanctionIndividuals.length}`);
        unSanctionIndividuals.forEach((doc, index) => {
            console.log(`\nIndividual ${index + 1}:`);
            printDocument(doc, 'individual');
        });

        console.log('\nEntities collection:');
        console.log(`Total documents found: ${unSanctionEntities.length}`);
        unSanctionEntities.forEach((doc, index) => {
            console.log(`\nEntity ${index + 1}:`);
            printDocument(doc, 'entity');
        });

        // Process results from second database
        console.log('\nResults from second database:');
        console.log('Individuals collection:');
        console.log(`Total documents found: ${secondDbIndividuals.length}`);
        secondDbIndividuals.forEach((doc, index) => {
            console.log(`\nIndividual ${index + 1}:`);
            printDocument(doc, 'individual');
        });

        console.log('\nEntities collection:');
        console.log(`Total documents found: ${secondDbEntities.length}`);
        secondDbEntities.forEach((doc, index) => {
            console.log(`\nEntity ${index + 1}:`);
            printDocument(doc, 'entity');
        });

        // Combined results summary
        const totalIndividuals = unSanctionIndividuals.length + secondDbIndividuals.length;
        const totalEntities = unSanctionEntities.length + secondDbEntities.length;
        console.log('\nTotal results across all databases:');
        console.log(`Individuals: ${totalIndividuals}`);
        console.log(`Entities: ${totalEntities}`);
        console.log(`Total: ${totalIndividuals + totalEntities}`);

    } catch (error) {
        console.error('Error querying databases:', error);
    } finally {
        await client.close();
    }
}

function printDocument(doc, type) {
    if (type === 'individual') {
        console.log('First Name:', doc.firstName);
        console.log('Second Name:', doc.secondName);
        console.log('Third Name:', doc.thirdName);
        console.log('Reference Number:', doc.referenceNumber);
        console.log('Alias Names:', doc.aliasNames);
    } else if (type === 'entity') {
        console.log('Entity Name:', doc.entityName);
        console.log('Reference Number:', doc.referenceNumber);
        console.log('Alias Names:', doc.aliasNames);
    }
    console.log('Full Document:', doc);
}

// Execute the function
queryMultipleDatabases('mohammad');