const express = require('express');
const router = express.Router();

// Example endpoint
router.get('/', (req, res) => {
  res.send('Map route is working!');
});

module.exports = router;
