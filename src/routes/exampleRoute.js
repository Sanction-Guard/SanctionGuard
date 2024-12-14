const express = require('express');
const router = express.Router();

// Example Endpoint
router.get('/example', (req, res) => {
    res.json({ message: 'This is an example route!' });
});

module.exports = router;
