const jwt = require("jsonwebtoken");

const authenticateUser = (req, res, next) => {
    const token = req.header("Authorization");

    if (!token) {
        return res.status(401).json({ message: "Access Denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), "your_secret_key");
        req.user = decoded; // Store user data in request
        next();
    } catch (error) {
        return res.status(400).json({ message: "Invalid token." });
    }
};

module.exports = authenticateUser;
