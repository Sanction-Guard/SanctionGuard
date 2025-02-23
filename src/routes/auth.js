const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Dummy users (Replace with a database later)
const users = [
    { id: 1, email: "admin@example.com", password: "admin123", role: "admin" },
    { id: 2, email: "user@example.com", password: "user123", role: "customer" }
];

// Login Route
router.post("/login", (req, res) => {
    const { email, password } = req.body;

    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT Token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, "your_secret_key", { expiresIn: "1h" });

    res.json({ message: "Login successful", token });
});

module.exports = router;
