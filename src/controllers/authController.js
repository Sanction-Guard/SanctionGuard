import { login } from '../services/authService.js';

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const token = await login(email, password);
        res.status(200).json({ success: true, token, message: 'Login successful' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};