import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { config } from 'dotenv';
import dotenv from "dotenv";
import mongoose from 'mongoose';

// Import routes
import authRoutes from './routes/authRoute.js';
import generalSettingsRoutes from './routes/generalSettingsRoute.js';
import userManagementRoutes from './routes/userRoute.js';
import notificationRoutes from './routes/notificationRoute.js';
import logsRoutes from './routes/logsRoute.js';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Logging

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/settings/general', generalSettingsRoutes);
app.use('/api/settings/users', userManagementRoutes);
app.use('/api/settings/notifications', notificationRoutes);
app.use('/api/settings/logs', logsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});



dotenv.config(); // Load environment variables

console.log("Loaded MONGO_URI:", process.env.MONGODB_URI); // Debugging line

const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error("❌ Error: MONGODB_URI is not defined in the .env file.");
  process.exit(1);
}

mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));
