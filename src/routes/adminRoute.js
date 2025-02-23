const express = require("express");
const router = express.Router();
const authenticateUser = require("../middlewares/authMiddleware");
const authorizeAdmin = require("../middlewares/adminMiddleware");

router.get("/admin-panel", authenticateUser, authorizeAdmin, (req, res) => {
    res.status(200).json({ message: "Welcome to the admin panel!" });
});

module.exports = router;
