import jwt from 'jsonwebtoken';
import { User } from '../config/userDB.js'; // Updated import
import bcrypt from 'bcryptjs';

export const login = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('User not found');
    }
    console.log('User found:', user); // Debug log
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
    return token;
};