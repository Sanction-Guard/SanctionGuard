import mongoose from 'mongoose';
import userSchema from './src/models/User.js'; // Import schema, not model
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Connect to User MongoDB
const userDB = mongoose.createConnection(process.env.USER_MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

userDB.on('error', console.error.bind(console, 'User DB connection error:'));
userDB.once('open', async () => {
    console.log('Connected to User MongoDB');

    // Define User model on this connection
    const User = userDB.model('User', userSchema);

    // Seed users
    try {
        const salt = await bcrypt.genSalt(10);
        const operatorPassword = await bcrypt.hash('operator123', salt);
        const managerPassword = await bcrypt.hash('manager123', salt);
        const adminPassword = await bcrypt.hash('admin123', salt);

        const users = [
            {
                email: 'operator@example.com',
                password: operatorPassword,
                role: 'operator',
            },
            {
                email: 'manager@example.com',
                password: managerPassword,
                role: 'manager',
            },
            {
                email: 'admin@example.com',
                password: adminPassword,
                role: 'admin',
            },
        ];

        await User.insertMany(users);
        console.log('Users seeded successfully!');
    } catch (error) {
        console.error('Error seeding users:', error);
    } finally {
        userDB.close(); // Use close() on the connection object
    }
});