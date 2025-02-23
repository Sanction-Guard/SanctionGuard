const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ✅ Middleware (Must be added before routes)
app.use(express.json()); // Parse JSON request bodies
app.use(cors());         // Enable CORS

// ✅ Import Routes
const authRoute = require("./routes/auth"); // Import auth.js
const sanctionsRoute = require("./routes/sanctionsRoute");
const pdfRoute = require("./routes/pdfRoute");

// ✅ API Routes (Now Includes Authentication Route)
app.use("/api/auth", authRoute);  // New auth route
app.use("/api/pdf", pdfRoute);
app.use("/api/sanctions", sanctionsRoute);

// ✅ Test Route
app.get("/", (req, res) => {
    res.send("Server is running");
});

// ✅ Global Error Handling Middleware
app.use((err, req, res, next) => {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
});

// ✅ Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
