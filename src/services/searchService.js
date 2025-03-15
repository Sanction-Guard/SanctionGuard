const stringSimilarity = require('string-similarity');
const { Client } = require('@elastic/elasticsearch');
require('dotenv').config(); // Load environment variables

const client = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD,
  },
});

const ELASTICSEARCH_INDEX = process.env.ELASTICSEARCH_INDEX;

const performSearch = async (searchTerm, searchType) => {
    try {
      const query = {
        query: {
          multi_match: {
            query: searchTerm,
            fields: ["firstName", "secondName", "thirdName", "full_name", "aka", "aliasNames"],
            fuzziness: "AUTO",
          },
        },
        size: 1000,
      };
  
      const response = await client.search({
        index: ELASTICSEARCH_INDEX,
        body: query,
      });
  
      console.log('Search Response:', response); // Debugging
  
      if (!response || !response.hits) {
        throw new Error('Invalid response from Elasticsearch: response.hits is undefined');
      }
  
      const hits = response.hits.hits || [];
  
      const formattedResults = hits.map((hit) => {
        const dbName = `${hit._source.firstName || ''} ${hit._source.secondName || ''} ${hit._source.thirdName || ''}`.trim();
        const similarity = stringSimilarity.compareTwoStrings(searchTerm.toLowerCase(), dbName.toLowerCase());
  
        return {
          referenceNumber: hit._source.referenceNumber || '-',
          fullName: dbName,
          dateOfBirth: hit._source.dateOfBirth || '-',
          nicNumber: hit._source.nicNumber || '-',
          similarityPercentage: (similarity * 100).toFixed(2),
          ...hit._source,
        };
      });
  
      const filteredResults = formattedResults.filter((result) => {
        if (searchType === 'individual') return result.type === 'individual';
        if (searchType === 'entity') return result.type === 'entity';
        return true;
      });
  
      filteredResults.sort((a, b) => b.similarityPercentage - a.similarityPercentage);
  
      return filteredResults;
    } catch (error) {
      console.error('Error in performSearch:', error);
      throw error;
    }
  };

  const getDatabaseStatus = async () => {
    try {
      // Fetch total records
      const countResponse = await client.count({
        index: ELASTICSEARCH_INDEX,
      });
  
      console.log('Count Response:', countResponse); // Debugging
  
      if (!countResponse) {
        throw new Error('Invalid response from Elasticsearch: countResponse is undefined');
      }
  
      const totalRecords = countResponse.count;
  
      // Fetch the most recent document by created_at
      const latestResponse = await client.search({
        index: ELASTICSEARCH_INDEX,
        body: {
          size: 1,
          sort: [{ "created_at": { "order": "desc" } }],
          _source: ["created_at"],
        },
      });
  
      console.log('Latest Response:', latestResponse); // Debugging
  
      if (!latestResponse || !latestResponse.hits) {
        throw new Error('Invalid response from Elasticsearch: latestResponse.hits is undefined');
      }
  
      const latestHit = latestResponse.hits.hits[0]?._source?.created_at;
  
      return {
        totalRecords,
        lastUpdated: latestHit ? new Date(latestHit).toLocaleString() : 'N/A',
      };
    } catch (error) {
      console.error('Error in getDatabaseStatus:', error);
      throw error;
    }
  };

module.exports = {
  performSearch,
  getDatabaseStatus,
};