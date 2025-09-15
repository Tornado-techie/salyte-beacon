const express = require('express');
const router = express.Router();

/**
 * Example: GET /api/sensors
 * Fetch all sensor data
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sensor route is working 🚀',
    data: [],
  });
});

/**
 * Example: POST /api/sensors
 * Save new sensor data
 */
router.post('/', (req, res) => {
  const { type, value } = req.body;

  if (!type || !value) {
    return res.status(400).json({
      error: 'Missing fields',
      message: 'Sensor type and value are required',
    });
  }

  res.status(201).json({
    success: true,
    message: 'Sensor data received',
    data: { type, value },
  });
});

module.exports = router;
