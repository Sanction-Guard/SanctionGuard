import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import searchRoutes from './src/routes/searchRoutes.js'; // Existing search routes
import authRoutes from './src/routes/authRoutes.js'; // New auth routes
import AuditLog from './src/models/AuditLog.js'; // Existing audit log model

console.log('Elasticsearch URL:', process.env.ELASTICSEARCH_URL);
console.log('Elasticsearch Index:', process.env.ELASTICSEARCH_INDEX);
console.log('MongoDB URI:', process.env.MONGODB_URI);
console.log('User MongoDB URI:', process.env.USER_MONGODB_URI);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/search', searchRoutes); // Existing search routes
app.use('/api/auth', authRoutes); // New auth routes

// Connect to Main MongoDB (for existing data)
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to Main MongoDB'))
    .catch((err) => console.error('Main MongoDB connection error:', err));

// Connect to User MongoDB (for user data)
const userDB = mongoose.createConnection(process.env.USER_MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});
userDB.on('error', console.error.bind(console, 'User DB connection error:'));
userDB.once('open', () => {
    console.log('Connected to User MongoDB');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});