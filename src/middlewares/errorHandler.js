// src/middlewares/errorHandler.js
const errorHandler = (err, req, res, next) => {
    res.status(500).json({ message: err.message || "Internal Server Error" });
};

// Change this to use ES module exports
export default errorHandler;