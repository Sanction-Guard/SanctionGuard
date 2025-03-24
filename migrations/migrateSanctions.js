const { MongoClient } = require('mongodb');
const { Client } = require('@elastic/elasticsearch');

// MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://SanctionGuard:SanctionGuard@sanctioncluster.2myce.mongodb.net/LocalSanction?retryWrites=true&w=majority&appName=SanctionCluster';

// Elasticsearch client with authentication
const esClient = new Client({
  node: 'http://34.238.157.184:9200',
  auth: {
    username: 'elastic',
    password: 'm8m3g9dZ1LsA2cTUpcd1'
  },
  requestTimeout: 30000 // Increase timeout to 30 seconds
});

// MongoDB client
const mongoClient = new MongoClient(MONGODB_URI);

async function migrateSanctions() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoClient.connect();
    console.log('Connected to MongoDB Atlas!');

    const localDB = mongoClient.db('LocalSanction');
    const unDB = mongoClient.db('UNSanction');

    // Migrate LocalSanction -> entities
    console.log('Fetching entities from LocalSanction...');
    const localEntities = await localDB.collection('entities').find({}).toArray();
    console.log(`Found ${localEntities.length} entities in LocalSanction.`);

    // Migrate LocalSanction -> individuals
    console.log('Fetching individuals from LocalSanction...');
    const localIndividuals = await localDB.collection('individuals').find({}).toArray();
    console.log(`Found ${localIndividuals.length} individuals in LocalSanction.`);

    // Migrate UNSanction -> entities
    console.log('Fetching entities from UNSanction...');
    const unEntities = await unDB.collection('entities').find({}).toArray();
    console.log(`Found ${unEntities.length} entities in UNSanction.`);

    // Migrate UNSanction -> individuals
    console.log('Fetching individuals from UNSanction...');
    const unIndividuals = await unDB.collection('individuals').find({}).toArray();
    console.log(`Found ${unIndividuals.length} individuals in UNSanction.`);

    // Prepare data for Elasticsearch bulk insert
    console.log('Preparing data for Elasticsearch bulk insert...');
    const allData = [
      ...localEntities.flatMap(doc => [
        { index: { _index: 'sanction_names', _id: doc._id.toString() } }, // Use MongoDB _id as the document ID
        {
          firstName: doc.firstName,
          secondName: doc.secondName,
          thirdName: doc.thirdName,
          aka: doc.aka || [], // Use empty array if `aka` is missing
          dob: doc.dob,
          nic: doc.nic,
          reference_number: doc.reference_number,
          created_at: doc.created_at,
          source: 'LocalSanction',
          type: 'entity',
          country: doc.country || 'Unknown'
        }
      ]),
      ...localIndividuals.flatMap(doc => [
        { index: { _index: 'sanction_names', _id: doc._id.toString() } }, // Use MongoDB _id as the document ID
        {
          firstName: doc.firstName,
          secondName: doc.secondName,
          thirdName: doc.thirdName,
          full_name: `${doc.firstName} ${doc.secondName} ${doc.thirdName}`,
          aka: doc.aka || [], // Use empty array if `aka` is missing
          dob: doc.dob,
          nic: doc.nic,
          reference_number: doc.reference_number,
          created_at: doc.created_at,
          source: 'LocalSanction',
          type: 'individual',
          country: doc.country || 'Unknown'
        }
      ]),
      ...unEntities.flatMap(doc => [
        { index: { _index: 'sanction_names', _id: doc._id.toString() } }, // Use MongoDB _id as the document ID
        {
          firstName: doc.firstName,
          secondName: doc.secondName,
          thirdName: doc.thirdName,
          aliasNames: doc.aliasNames || [], // Use empty array if `aliasNames` is missing
          dob: doc.dob,
          nic: doc.nic,
          reference_number: doc.reference_number,
          created_at: doc.created_at,
          source: 'UNSanction',
          type: 'entity',
          country: doc.country || 'Unknown'
        }
      ]),
      ...unIndividuals.flatMap(doc => [
        { index: { _index: 'sanction_names', _id: doc._id.toString() } }, // Use MongoDB _id as the document ID
        {
          firstName: doc.firstName,
          secondName: doc.secondName,
          thirdName: doc.thirdName,
          full_name: `${doc.firstName} ${doc.secondName} ${doc.thirdName}`,
          aliasNames: doc.aliasNames || [], // Use empty array if `aliasNames` is missing
          dob: doc.dob,
          nic: doc.nic,
          reference_number: doc.reference_number,
          created_at: doc.created_at,
          source: 'UNSanction',
          type: 'individual',
          country: doc.country || 'Unknown'
        }
      ])
    ];

    // Process data in batches to avoid timeouts or memory issues
    const batchSize = 100; // Process 100 documents at a time
    console.log(`Inserting data in batches of ${batchSize}...`);

    for (let i = 0; i < allData.length; i += batchSize * 2) { // Multiply by 2 because each document has 2 entries (index + data)
      const batch = allData.slice(i, i + batchSize * 2);
      console.log(`Inserting batch ${i / (batchSize * 2) + 1}...`);

      try {
        const response = await esClient.bulk({
          refresh: true,
          body: batch
        });

        if (response.errors) {
          console.error('Errors during bulk insert:', response.items.filter(item => item.index.error));
        } else {
          console.log(`Batch ${i / (batchSize * 2) + 1} inserted successfully.`);
        }
      } catch (err) {
        console.error(`Error inserting batch ${i / (batchSize * 2) + 1}:`, err);
        console.error('Batch data:', JSON.stringify(batch, null, 2)); // Log the batch data for debugging
      }
    }

    console.log('Migration completed!');
  } catch (err) {
    console.error('Error during migration:', err);
    console.error('Stack trace:', err.stack); // Log the stack trace for debugging
  } finally {
    await mongoClient.close();
    console.log('MongoDB connection closed.');
  }
}

// Run the migration
migrateSanctions();