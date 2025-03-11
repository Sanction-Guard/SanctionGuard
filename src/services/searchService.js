const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

// Initialize Elasticsearch client
let client;
try {
    client = new Client({
        node: process.env.ELASTICSEARCH_URL,
        auth: {
            username: process.env.ELASTICSEARCH_USERNAME,
            password: process.env.ELASTICSEARCH_PASSWORD
        },
        ssl: {
            rejectUnauthorized: false
        }
    });
    console.log("Elasticsearch client initialized successfully");
} catch (err) {
    console.error("Failed to initialize Elasticsearch client:", err);
    throw err;
}

// Search sanctions using Elasticsearch client
exports.searchElasticsearch = async (searchTerm) => {
    try {
        const { body } = await client.search({
            index: process.env.ELASTICSEARCH_INDEX,
            body: {
                query: {
                    multi_match: {
                        query: searchTerm,
                        fields: ['firstName', 'secondName', 'thirdName', 'full_name', 'aka', 'aliasNames'],
                        fuzziness: 'AUTO'
                    }
                }
            },
            size: 1000
        });

        return body.hits.hits.map(hit => hit._source);
    } catch (error) {
        console.error('Elasticsearch search error:', error);
        throw new Error('Failed to fetch search results');
    }
};

// Fetch database status (total records & last updated time)
exports.fetchDatabaseStatus = async () => {
    try {
        console.log("Fetching database status...");

        // Fetch total record count
        const countResult = await client.count({
            index: process.env.ELASTICSEARCH_INDEX
        });
        console.log("Count result:", countResult);

        if (!countResult || !countResult.body) {
            throw new Error("Invalid count result from Elasticsearch");
        }

        // Fetch most recent document's created_at
        const latestResult = await client.search({
            index: process.env.ELASTICSEARCH_INDEX,
            body: {
                size: 1,
                sort: [{ "created_at": { "order": "desc" } }],
                _source: ["created_at"]
            }
        });
        console.log("Latest result:", latestResult);

        if (!latestResult || !latestResult.body) {
            throw new Error("Invalid latest result from Elasticsearch");
        }

        const totalRecords = countResult.body.count;
        const lastUpdated = latestResult.body.hits.hits[0]?._source?.created_at || 'N/A';

        return { totalRecords, lastUpdated };
    } catch (err) {
        console.error('Error fetching database status:', err);
        return { totalRecords: 0, lastUpdated: 'Error' };
    }
};