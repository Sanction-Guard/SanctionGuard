import { login } from '../services/authService.js';

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const token = await login(email, password);
        res.json({ token });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};