const express = require("express");
const router = express.Router();
const authenticateUser = require("../middlewares/authMiddleware");

router.get("/dashboard", authenticateUser, (req, res) => {
    res.status(200).json({ message: "Welcome to your dashboard!", user: req.user });
});

module.exports = router;
