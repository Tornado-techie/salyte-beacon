const express = require('express');
const router = express.Router();

// Example: GET /api/report
router.get('/', (req, res) => {
  res.json({ message: 'Report API is working!' });
});

// Example: POST /api/report
router.post('/', (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  // Later you can save to MongoDB, for now we just return what we got
  res.json({
    message: 'Report created successfully',
    report: { title, content }
  });
});

module.exports = router;
