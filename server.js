import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import searchRoutes from './src/routes/searchRoutes.js'; // 👈 Use import
import AuditLog from './src/models/AuditLog.js'; // 👈 Use import

console.log('Elasticsearch URL:', process.env.ELASTICSEARCH_URL);
console.log('Elasticsearch Index:', process.env.ELASTICSEARCH_INDEX);
console.log('MongoDB URI:', process.env.MONGODB_URI);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/search', searchRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});