import stringSimilarity from 'string-similarity';
import { Client } from '@elastic/elasticsearch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Elasticsearch client
const client = new Client({
  node: process.env.ELASTICSEARCH_URL,
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD,
  },
});

const ELASTICSEARCH_INDEX = process.env.ELASTICSEARCH_INDEX;

const calculateAverageSimilarity = (searchTerm, dbName) => {
  const searchParts = searchTerm.toLowerCase().trim().split(/\s+/); // Split search term into words
  const dbParts = dbName.toLowerCase().trim().split(/\s+/); // Split database name into words

  // Calculate the similarity of each search part against all db parts
  const searchPartScores = searchParts.map(searchPart => {
    const similarities = dbParts.map(dbPart =>
        stringSimilarity.compareTwoStrings(searchPart, dbPart)
    );
    // Get the highest similarity for this search part
    return Math.max(...similarities, 0);
  });

  // Calculate the similarity of each db part against all search parts
  const dbPartScores = dbParts.map(dbPart => {
    const similarities = searchParts.map(searchPart =>
        stringSimilarity.compareTwoStrings(dbPart, searchPart)
    );
    // Get the highest similarity for this db part
    return Math.max(...similarities, 0);
  });

  // Calculate the average score for search parts
  const searchPartsAvg = searchPartScores.length > 0
      ? searchPartScores.reduce((sum, score) => sum + score, 0) / searchPartScores.length
      : 0;

  // Calculate the average score for db parts
  const dbPartsAvg = dbPartScores.length > 0
      ? dbPartScores.reduce((sum, score) => sum + score, 0) / dbPartScores.length
      : 0;

  // Return the highest average as the final similarity score
  const highestAvg = Math.max(searchPartsAvg, dbPartsAvg);

  return (highestAvg * 100).toFixed(2); // Convert to percentage
};

const performSearch = async (searchTerm, searchType) => {
  try {
    const query = {
      query: {
        multi_match: {
          query: searchTerm,
          fields: ['firstName', 'secondName', 'thirdName', 'full_name', 'aka', 'aliasNames'],
          fuzziness: 'AUTO',
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
      const similarityPercentage = calculateAverageSimilarity(searchTerm, dbName);

      return {
        referenceNumber: hit._source.referenceNumber || '-',
        fullName: dbName,
        dateOfBirth: hit._source.dateOfBirth || '-',
        nicNumber: hit._source.nicNumber || '-',
        similarityPercentage,
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
        sort: [{ created_at: { order: 'desc' } }],
        _source: ['created_at'],
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

// Export functions
export default { performSearch, getDatabaseStatus };