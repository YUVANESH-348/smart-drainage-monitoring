const express = require('express');
const router = express.Router();
const {
  createReading,
  getLatestReading,
  getReadings,
  getStatus,
  getTrendAndPrediction
} = require('../controllers/readingController');
const { requireDeviceKey } = require('../middleware/deviceAuth');

router.post('/', requireDeviceKey, createReading);
router.get('/latest', getLatestReading);
router.get('/trend', getTrendAndPrediction);
router.get('/', getReadings);

module.exports = router;
