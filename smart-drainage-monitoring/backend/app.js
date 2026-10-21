require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { testConnection } = require('./config/db');
const readingRoutes = require('./routes/readingRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const authRoutes = require('./routes/authRoutes');
const { getStatus } = require('./controllers/readingController');
const { errorHandler, notFoundHandler, asyncHandler } = require('./middleware/errorHandler');
const { loadDeviceKeys } = require('./middleware/deviceAuth');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '32kb' }));

app.get('/', (req, res) => {
  res.json({
    message: 'Smart Drainage Monitoring API is running',
    prototype: true
  });
});

app.use('/api/readings', readingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.get('/api/status', asyncHandler(getStatus));

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  const dbOk = await testConnection();
  if (!dbOk) {
    console.warn('⚠ MySQL is not reachable. The API will return database errors until it is available.');
  } else {
    console.log('✓ MySQL connection OK');
  }

  const deviceKeys = loadDeviceKeys();
  if (Object.keys(deviceKeys).length === 0) {
    console.warn('⚠ No device API keys configured. Set DEVICE_API_KEY or DEVICE_KEYS_JSON in backend/.env.');
  } else {
    console.log(`✓ Device authentication configured for: ${Object.keys(deviceKeys).join(', ')}`);
  }

  app.listen(PORT, () => {
    console.log(`✓ Smart Drainage API listening on http://localhost:${PORT}`);
  });
}

if (require.main === module) start();

module.exports = app;
