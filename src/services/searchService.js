const ELASTICSEARCH_URL = process.env.ELASTICSEARCH_URL;
const ELASTICSEARCH_INDEX = process.env.ELASTICSEARCH_INDEX;
const ELASTICSEARCH_USERNAME = process.env.ELASTICSEARCH_USERNAME;
const ELASTICSEARCH_PASSWORD = process.env.ELASTICSEARCH_PASSWORD;
const { Client } = require('@elastic/elasticsearch');
require('dotenv').config();

const client = new Client({
    node: process.env.ELASTICSEARCH_URL,
    auth: {
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD
    },
    ssl: {
      rejectUnauthorized: false
    }
  });

  module.exports = client;

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
      // Fetch total record count
      const countResult = await client.count({
        index: process.env.ELASTICSEARCH_INDEX
      });
  
      const totalRecords = countResult.body.count;
  
      // Fetch most recent document's created_at
      const latestResult = await client.search({
        index: process.env.ELASTICSEARCH_INDEX,
        body: {
          size: 1,
          sort: [{ "created_at": { "order": "desc" } }],
          _source: ["created_at"]
        }
      });
  
      const lastUpdated = latestResult.body.hits.hits[0]?._source?.created_at || 'N/A';
  
      return { totalRecords, lastUpdated };
    } catch (err) {
      console.error('Error fetching database status:', err);
      return { totalRecords: 0, lastUpdated: 'Error' };
    }
  };