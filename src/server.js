require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const searchRoutes = require('./routes/searchRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/search', searchRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
