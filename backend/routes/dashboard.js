const express = require('express');
const router = express.Router();

// Example: GET /api/dashboard
router.get('/', (req, res) => {
  res.json({ message: 'Dashboard API is working!' });
});

module.exports = router;
