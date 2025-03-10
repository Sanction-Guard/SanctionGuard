require('dotenv').config();

const express = require('express');
const dotenv = require('dotenv');
const searchRoutes = require('./routes/searchRoutes');
const cors = require('cors');
const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
app.use(express.json());
app.use('/api', searchRoutes);

const PORT = process.env.PORT || 3001;
console.log("Elasticsearch URL:", process.env.ELASTICSEARCH_URL);
console.log("Elasticsearch Index:", process.env.ELASTICSEARCH_INDEX);
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));