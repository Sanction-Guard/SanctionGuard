import mongoose from 'mongoose';
import 'dotenv/config';

// Create a new Mongoose instance for the local connection
const localMongoose = new mongoose.Mongoose();

export const connectDBLocal = async () => {
    try {
        await localMongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Local MongoDB Connected Successfully');
    } catch (error) {
        console.error('❌ Local MongoDB Connection Error:', error.message);
    }
};

// Export the localMongoose instance
export { localMongoose };