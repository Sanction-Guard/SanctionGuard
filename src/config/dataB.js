import mongoose from 'mongoose';
import 'dotenv/config';

const userMongoose = new mongoose.Mongoose();

export const connectDBuser = async () => {
    try {
        await userMongoose.connect(process.env.MONGODB_URI);
        console.log('✅ user MongoDB Connected Successfully');
    } catch (error) {
        console.error('❌ User MongoDB Connection Error:', error.message);
    }
};

// Export the localMongoose instance
export { userMongoose };