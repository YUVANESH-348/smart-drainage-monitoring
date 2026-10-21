// Simple device authentication for ESP32/simulator requests.
// Keys are kept in environment variables, never in frontend code or source control.

const { ApiError } = require('./errorHandler');

function loadDeviceKeys() {
  const raw = process.env.DEVICE_KEYS_JSON;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (err) {
      console.error('Invalid DEVICE_KEYS_JSON:', err.message);
    }
  }

  const fallback = process.env.DEVICE_API_KEY;
  const defaultDevice = process.env.DEFAULT_DEVICE_ID || 'DRAIN_001';
  return fallback ? { [defaultDevice]: fallback } : {};
}

function requireDeviceKey(req, res, next) {
  const deviceId = req.body?.deviceId;
  const suppliedKey = req.get('X-Device-Key');
  const keys = loadDeviceKeys();

  if (!deviceId || typeof deviceId !== 'string') {
    return next(new ApiError(400, 'deviceId is required'));
  }

  if (!suppliedKey) {
    return next(new ApiError(401, 'Missing X-Device-Key header'));
  }

  const expectedKey = keys[deviceId];
  if (!expectedKey || suppliedKey !== expectedKey) {
    return next(new ApiError(401, 'Invalid device credentials'));
  }

  return next();
}

module.exports = { requireDeviceKey, loadDeviceKeys };
