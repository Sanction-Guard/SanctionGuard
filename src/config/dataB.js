// import mongoose from 'mongoose';
// import 'dotenv/config';

// const userMongoose = new mongoose.Mongoose();

// export const connectDBuser = async () => {
//     try {
//         await localMongoose.connect(process.env.MONGODB_URI);
//         console.log('✅ user MongoDB Connected Successfully');
//     } catch (error) {
//         console.error('❌ User MongoDB Connection Error:', error.message);
//     }
// };

// // Export the localMongoose instance
// export { userMongoose };

import mongoose from 'mongoose';
import 'dotenv/config';

// Create a new Mongoose instance for user data
const userMongoose = new mongoose.Mongoose();

export const connectDBuser = async () => {
    try {
        // Use MONGODB_URI_NEW instead of undefined variable
        await userMongoose.connect(process.env.MONGODB_URI_NEW);
        console.log('✅ User MongoDB Connected Successfully');
    } catch (error) {
        console.error('❌ User MongoDB Connection Error:', error.message);
    }
};

// Export the userMongoose instance
export { userMongoose };