const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import Routes
const sanctionsRoute = require('./routes/sanctionsRoute');

const app = express();

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(cors());         // Enable CORS

// Routes
app.use('/api/sanctions', sanctionsRoute); // Integrate the example route

// Test Route
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
