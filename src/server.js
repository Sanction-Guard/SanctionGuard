require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const path = require('path');
const searchRoutes = require('./routes/searchRoutes');
const connectDB = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/search', searchRoutes);

// Routes (Fixed path issue)
app.use('/api/pdf', require(path.join(__dirname, 'routes/pdfRoute')));

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
