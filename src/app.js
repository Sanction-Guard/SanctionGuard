const express = require('express');
const mongoose = require('mongoose');
const pdfRoutes = require('./routes/pdfRoutes');
const config = require('./config/db');

const app = express();

// Middleware
app.use(express.json());

// Database Connection
mongoose.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Routes
app.use('/api/pdf', pdfRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

module.exports = app;