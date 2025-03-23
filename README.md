# SanctionGuard

SanctionGuard is a Node.js-based compliance solution designed to help organizations screen individuals and entities against global sanctions lists to ensure regulatory compliance.

## Overview

SanctionGuard provides automated screening capabilities against multiple sanctions lists, helping organizations comply with international regulations and avoid penalties associated with doing business with sanctioned parties.

## Features

- **Multi-list Screening**: Check against major global sanctions lists including OFAC, UN, EU, UK and more
- **Real-time Monitoring**: Continuous monitoring of changes to sanctions lists
- **Elasticsearch-Powered Matching**: Sophisticated name and entity matching leveraging Elasticsearch's powerful search capabilities
- **Cloud-Based Storage**: Secure, scalable data storage with MongoDB Atlas
- **Audit Trail**: Comprehensive logging of all screening activities for compliance audits
- **Risk Scoring**: Customizable risk scoring based on match quality and sanctions severity
- **API Integration**: Easy integration with existing systems via REST API
- **Batch Processing**: Ability to screen large datasets efficiently
- **User-friendly Dashboard**: Intuitive interface for reviewing and managing potential matches

## Installation

```bash
# Clone the repository
git clone https://github.com/Sanction-Guard/SanctionGuard.git

# Navigate to the project directory
cd SanctionGuard

# Install dependencies
npm install

# Configure the application
cp .env.example .env
# Edit .env file with your configuration

# Start the application
npm start
```

## Prerequisites

- Node.js 16+
- Elasticsearch 7.x or 8.x
- MongoDB Atlas account
- Redis (optional, for caching)

## Configuration

SanctionGuard can be configured through the `.env` file or environment variables:

```
# API Configuration
API_KEY=your_api_key
PORT=3000
NODE_ENV=production

# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://username:password@cluster0.example.mongodb.net/sanctionguard?retryWrites=true&w=majority
MONGODB_DB_NAME=sanctionguard

# Elasticsearch Configuration
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your_password
ELASTICSEARCH_INDEX_PREFIX=sanctionguard_

# Sanctions Lists Configuration
SANCTION_LISTS=OFAC,EU,UN
UPDATE_INTERVAL=86400

# Logging
LOG_LEVEL=info
```

## Usage

### API Example

```javascript
// JavaScript example
const response = await fetch('https://api.sanctionguard.com/v1/screen', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_KEY'
  },
  body: JSON.stringify({
    name: 'John Smith',
    country: 'US',
    dateOfBirth: '1980-01-01',
    matchThreshold: 0.75
  })
});

const result = await response.json();
console.log(result);
```

### Integration in Node.js Applications

```javascript
const { SanctionGuard } = require('sanctionguard');

const sanctionGuard = new SanctionGuard({
  apiKey: 'YOUR_API_KEY',
  defaultLists: ['OFAC', 'EU', 'UN'],
  elasticsearchConfig: {
    node: 'http://localhost:9200',
    auth: {
      username: 'elastic',
      password: 'your_password'
    }
  },
  mongodbConfig: {
    uri: 'mongodb+srv://username:password@cluster0.example.mongodb.net/sanctionguard?retryWrites=true&w=majority',
    dbName: 'sanctionguard'
  }
});

async function screenEntity() {
  try {
    const result = await sanctionGuard.screen({
      name: 'Acme Corporation',
      country: 'IR',
      type: 'entity',
      matchThreshold: 0.8
    });
    
    console.log('Screening result:', result);
    console.log('Match found:', result.matchFound);
    console.log('Risk score:', result.riskScore);
    
    if (result.matches.length > 0) {
      console.log('Matches:', result.matches);
    }
  } catch (error) {
    console.error('Screening error:', error);
  }
}

screenEntity();
```

## Documentation

For full documentation, visit [docs.sanctionguard.com](https://docs.sanctionguard.com)

## Architecture

SanctionGuard consists of several key components:

1. **Data Ingestion Service**: Express.js service that regularly updates and normalizes sanctions list data
2. **Elasticsearch Indexing**: Process that indexes sanctions data into optimized Elasticsearch indices
3. **Matching Engine**: Node.js module that leverages Elasticsearch queries for powerful entity matching
4. **API Layer**: Express.js REST API that exposes functionality to external systems
5. **Dashboard**: React.js web interface for managing and reviewing results
6. **MongoDB Atlas Database**: Cloud-based storage for user data, screening history, and audit logs

## MongoDB Atlas Implementation

SanctionGuard uses MongoDB Atlas for secure, scalable data management:

- **Cloud-Based Architecture**: Fully managed database service with built-in redundancy
- **Automated Backups**: Regular automated backups with point-in-time recovery
- **Data Encryption**: Encryption at rest and in transit
- **Flexible Schema**: Document-based data model ideal for varied sanctions data
- **Horizontal Scaling**: Easy scaling as your screening volume grows
- **Compliance Support**: SOC 2, HIPAA, ISO, and other compliance certifications
- **Built-in Analytics**: MongoDB Charts for visualization of screening patterns and trends

## Elasticsearch Implementation

SanctionGuard uses Elasticsearch to provide powerful, scalable matching capabilities:

- **Multiple Match Algorithms**: Combines exact matching, phonetic matching, and n-gram matching
- **Configurable Match Thresholds**: Adjustable match confidence scoring
- **Advanced Queries**: Utilizes Elasticsearch's query DSL for complex matching scenarios
- **Scalability**: Horizontally scalable to handle large sanctions lists and high screening volumes
- **Performance**: Fast response times even with complex matching criteria

## Development

### Setting Up Development Environment

```bash
# Install development dependencies
npm install

# Start Elasticsearch (using Docker)
docker-compose up -d elasticsearch

# Set up initial indices and mappings
npm run setup:elasticsearch

# Configure MongoDB Atlas connection in .env file
# MONGODB_URI_NEW=mongodb+srv://username:password@cluster0.example.mongodb.net/sanctionguard?retryWrites=true&w=majority

# Run database migrations
npm run migrate

# Run tests
npm test

# Run linter
npm run lint

# Start in development mode with hot reload
npm run dev
```

## Project Structure

```
├── src/
│   ├── api/                  # API routes and controllers
│   ├── config/               # Configuration files
│   ├── models/               # MongoDB models
│   ├── services/             # Business logic services
│   │   ├── elasticsearch/    # Elasticsearch client and query builders
│   │   ├── lists/            # Sanctions list management
│   │   └── screening/        # Screening service
│   ├── utils/                # Utility functions
│   └── index.js              # Application entry point
├── client/                   # Frontend React application
├── elasticsearch/            # Elasticsearch mappings and scripts
├── migrations/               # MongoDB migrations
├── tests/                    # Test files
├── docker-compose.yml        # Docker services configuration
├── .env.example              # Example environment variables
├── package.json              # Project dependencies and scripts
└── README.md                 # This file
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@sanctionguard.com or open an issue on GitHub.

## Acknowledgements

- [OFAC](https://home.treasury.gov/policy-issues/financial-sanctions/specially-designated-nationals-and-blocked-persons-list-sdn-human-readable-lists) for providing sanctions data
- [EU Sanctions List](https://data.europa.eu/euodp/en/data/dataset/consolidated-list-of-persons-groups-and-entities-subject-to-eu-financial-sanctions) for providing sanctions data
- [UN Security Council](https://www.un.org/securitycouncil/content/un-sc-consolidated-list) for providing sanctions data
- [Elasticsearch](https://www.elastic.co/elasticsearch/) for providing the search engine that powers our matching capabilities
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for providing the cloud database platform for our application
