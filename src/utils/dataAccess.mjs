// import express from 'express';
// import cors from 'cors';
// import { MongoClient } from 'mongodb';

// const app = express();
// const port = process.env.PORT || 5000;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // MongoDB Atlas Connection
// const DB_USERNAME = 'SanctionGuard';
// const DB_PASSWORD = 'SanctionGuard';
// const DB_CLUSTER = 'sanctioncluster.2myce.mongodb.net';

// const uri = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@${DB_CLUSTER}/test?retryWrites=true&w=majority`;
// const client = new MongoClient(uri);

// // Connect to MongoDB
// async function connectDB() {
//   try {
//     await client.connect();
//     console.log('Connected to MongoDB Atlas');
//   } catch (err) {
//     console.error('MongoDB connection error:', err);
//   }
// }
// connectDB();

// // Search API Endpoint
// app.post('/api/search', async (req, res) => {
//   try {
//     const { fullName } = req.body;
    
//     if (!fullName || fullName.trim() === '') {
//       return res.status(400).json({ 
//         success: false, 
//         error: 'Search name is required' 
//       });
//     }

//     // Split the full name into parts
//     const nameParts = fullName.trim().split(/\s+/);
//     const firstName = nameParts[0] || '';
//     const secondName = nameParts[1] || '';
//     const thirdName = nameParts.slice(2).join(' ') || ''; // Combine remaining parts as third name

//     console.log(`Searching for: firstName=${firstName}, secondName=${secondName}, thirdName=${thirdName}`);

//     // First Database
//     const unSanctionDb = client.db('UNSanction');
//     // Second Database
//     const secondDb = client.db('LocalSanction');

//     // Collections from both databases
//     const collections = {
//       unSanction: {
//         individuals: unSanctionDb.collection('individuals'),
//         entities: unSanctionDb.collection('entities')
//       },
//       secondDb: {
//         individuals: secondDb.collection('individuals'),
//         entities: secondDb.collection('entities')
//       }
//     };

//     // Create regex for each name part
//     const firstNameRegex = new RegExp(firstName, 'i');
//     const secondNameRegex = new RegExp(secondName, 'i');
//     const thirdNameRegex = new RegExp(thirdName, 'i');
    
//     // Create regex for full name to search in aliasNames
//     const fullNameRegex = new RegExp(fullName, 'i');
    
//     // Create regex for each individual name part to match against aliasNames
//     const namePartsRegexes = nameParts.map(part => new RegExp(part, 'i'));
    
//     // Build the query for individuals
//     const individualQuery = {
//       $or: [
//         // Match by exact name parts
//         { firstName: firstNameRegex },
//         { secondName: secondNameRegex },
//         { thirdName: thirdNameRegex },
//         // Match full name against aliasNames
//         { aliasNames: fullNameRegex },
//         // Match individual name parts against aliasNames
//         ...namePartsRegexes.map(regex => ({ aliasNames: regex }))
//       ]
//     };
    
//     // Build the query for entities
//     const entityQuery = {
//       $or: [
//         // Match against entity name
//         { entityName: fullNameRegex },
//         // Match individual parts against entity name
//         ...namePartsRegexes.map(regex => ({ entityName: regex })),
//         // Match full name against aliasNames
//         { aliasNames: fullNameRegex },
//         // Match individual name parts against aliasNames
//         ...namePartsRegexes.map(regex => ({ aliasNames: regex }))
//       ]
//     };

//     // Execute queries on all collections simultaneously
//     const [
//       unSanctionIndividuals,
//       unSanctionEntities,
//       secondDbIndividuals,
//       secondDbEntities
//     ] = await Promise.all([
//       collections.unSanction.individuals.find(individualQuery).toArray(),
//       collections.unSanction.entities.find(entityQuery).toArray(),
//       collections.secondDb.individuals.find(individualQuery).toArray(),
//       collections.secondDb.entities.find(entityQuery).toArray()
//     ]);

//     // Prepare results object
//     const results = {
//       unSanction: {
//         individuals: unSanctionIndividuals,
//         entities: unSanctionEntities
//       },
//       localSanction: {
//         individuals: secondDbIndividuals,
//         entities: secondDbEntities
//       },
//       summary: {
//         totalIndividuals: unSanctionIndividuals.length + secondDbIndividuals.length,
//         totalEntities: unSanctionEntities.length + secondDbEntities.length,
//         total: unSanctionIndividuals.length + unSanctionEntities.length + 
//                secondDbIndividuals.length + secondDbEntities.length
//       }
//     };

//     // Log results to server console
//     console.log('\nResults from UNSanction database:');
//     console.log('Individuals collection:');
//     console.log(`Total documents found: ${unSanctionIndividuals.length}`);
//     unSanctionIndividuals.forEach((doc, index) => {
//         console.log(`\nIndividual ${index + 1}:`);
//         printDocument(doc, 'individual');
//     });

//     console.log('\nEntities collection:');
//     console.log(`Total documents found: ${unSanctionEntities.length}`);
//     unSanctionEntities.forEach((doc, index) => {
//         console.log(`\nEntity ${index + 1}:`);
//         printDocument(doc, 'entity');
//     });

//     // Process results from second database
//     console.log('\nResults from second database:');
//     console.log('Individuals collection:');
//     console.log(`Total documents found: ${secondDbIndividuals.length}`);
//     secondDbIndividuals.forEach((doc, index) => {
//         console.log(`\nIndividual ${index + 1}:`);
//         printDocument(doc, 'individual');
//     });

//     console.log('\nEntities collection:');
//     console.log(`Total documents found: ${secondDbEntities.length}`);
//     secondDbEntities.forEach((doc, index) => {
//         console.log(`\nEntity ${index + 1}:`);
//         printDocument(doc, 'entity');
//     });

//     // Send results to client
//     res.json({ 
//       success: true, 
//       data: results,
//       searchInfo: {
//         fullName,
//         nameParts: {
//           firstName,
//           secondName,
//           thirdName
//         }
//       }
//     });
    
//   } catch (error) {
//     console.error('Error querying databases:', error);
//     res.status(500).json({ 
//       success: false, 
//       error: error.message 
//     });
//   }
// });

// function printDocument(doc, type) {
//     if (type === 'individual') {
//         console.log('First Name:', doc.firstName);
//         console.log('Second Name:', doc.secondName);
//         console.log('Third Name:', doc.thirdName);
//         console.log('Reference Number:', doc.referenceNumber);
//         console.log('Alias Names:', doc.aliasNames);
//     } else if (type === 'entity') {
//         console.log('Entity Name:', doc.entityName);
//         console.log('Reference Number:', doc.referenceNumber);
//         console.log('Alias Names:', doc.aliasNames);
//     }
//     console.log('Full Document:', doc);
// }

// // Start server
// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });