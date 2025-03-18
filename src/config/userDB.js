import mongoose from 'mongoose';
import userSchema from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const userDB = mongoose.createConnection(process.env.USER_MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

userDB.on('error', console.error.bind(console, 'User DB connection error:'));
userDB.once('open', () => {
    console.log('Connected to User MongoDB');
});

const User = userDB.model('User', userSchema);

export { userDB, User };