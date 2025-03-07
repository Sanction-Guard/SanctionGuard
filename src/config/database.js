import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const DB_USERNAME = process.env.DB_USERNAME || 'SanctionGuard';
const DB_PASSWORD = process.env.DB_PASSWORD || 'SanctionGuard';
const DB_CLUSTER = process.env.DB_CLUSTER || 'sanctioncluster.2myce.mongodb.net';
const DB_NAME = process.env.DB_NAME || 'UNSanction';

export const MONGO_URI = `mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@${DB_CLUSTER}/${DB_NAME}?retryWrites=true&w=majority`;

export const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB Atlas successfully');
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        throw error;
    }
};

// DB_USERNAME=SanctionGuard
// DB_PASSWORD=SanctionGuard
// DB_CLUSTER=sanctioncluster.2myce.mongodb.net
// DB_NAME=UNSanction

// UN_SANCTIONS_URL=https://scsanctions.un.org/resources/xml/en/consolidated.xml

// # Optional: Add any additional environment-specific variables
// NODE_ENV=production