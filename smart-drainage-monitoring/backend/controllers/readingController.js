// backend/controllers/readingController.js

const { pool } = require('../config/db');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { calculateRisk, calculateTrend, estimateOverflow } = require('../services/riskService');

const TREND_WINDOW = 10;
const DEFAULT_DEVICE_ID = process.env.DEFAULT_DEVICE_ID || 'DRAIN_001';
const DEFAULT_LOCATION = process.env.DEFAULT_LOCATION || 'Main Gate';

function validateReadingInput(body) {
  const {
    deviceId = DEFAULT_DEVICE_ID,
    location = DEFAULT_LOCATION,
    latitude = null,
    longitude = null,
    rainLevel,
    waterLevel,
    flowRate,
    waterLevelRate = null,
    timestamp = null,
    source = 'REAL'
  } = body;

  if (typeof deviceId !== 'string' || !/^[A-Za-z0-9_-]{3,64}$/.test(deviceId)) {
    throw new ApiError(400, 'deviceId must contain 3-64 letters, numbers, "_" or "-"');
  }

  if (waterLevel === undefined || flowRate === undefined || rainLevel === undefined) {
    throw new ApiError(400, 'waterLevel, flowRate and rainLevel are all required');
  }

  const wl = Number(waterLevel);
  const fr = Number(flowRate);
  const rl = Number(rainLevel);

  if (![wl, fr, rl].every(Number.isFinite)) {
    throw new ApiError(400, 'waterLevel, flowRate and rainLevel must be numbers');
  }
  if (wl < 0 || wl > 100) throw new ApiError(400, 'waterLevel must be between 0 and 100');
  if (fr < 0) throw new ApiError(400, 'flowRate must be 0 or greater');
  if (rl < 0 || rl > 100) throw new ApiError(400, 'rainLevel must be between 0 and 100');

  let normalizedRate = null;
  if (waterLevelRate !== null && waterLevelRate !== undefined) {
    normalizedRate = Number(waterLevelRate);
    if (!Number.isFinite(normalizedRate)) {
      throw new ApiError(400, 'waterLevelRate must be a number when provided');
    }
    if (normalizedRate < -100 || normalizedRate > 100) {
      throw new ApiError(400, 'waterLevelRate must be between -100 and 100 %/min');
    }
  }

  let normalizedTimestamp = null;
  if (timestamp !== null && timestamp !== undefined) {
    const parsed = Date.parse(timestamp);
    if (Number.isNaN(parsed)) throw new ApiError(400, 'timestamp is not a valid ISO date');
    normalizedTimestamp = new Date(parsed);
  }

  const normalizedSource = String(source).toUpperCase();
  if (!['REAL', 'SIMULATION'].includes(normalizedSource)) {
    throw new ApiError(400, 'source must be REAL or SIMULATION');
  }

  const lat = latitude === null || latitude === '' ? null : Number(latitude);
  const lon = longitude === null || longitude === '' ? null : Number(longitude);
  if (lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) {
    throw new ApiError(400, 'latitude must be between -90 and 90');
  }
  if (lon !== null && (!Number.isFinite(lon) || lon < -180 || lon > 180)) {
    throw new ApiError(400, 'longitude must be between -180 and 180');
  }

  return {
    deviceId,
    location: String(location || DEFAULT_LOCATION).slice(0, 255),
    latitude: lat,
    longitude: lon,
    waterLevel: wl,
    flowRate: fr,
    rainLevel: rl,
    suppliedWaterLevelRate: normalizedRate,
    timestamp: normalizedTimestamp,
    source: normalizedSource
  };
}

async function calculateMeasuredRate(deviceId, waterLevel, currentTime) {
  const [rows] = await pool.query(
    `SELECT water_level, created_at
     FROM drainage_readings
     WHERE device_id = ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [deviceId]
  );

  if (!rows.length) return 0;

  const previousLevel = Number(rows[0].water_level);
  const previousTime = new Date(rows[0].created_at);
  const minutes = (currentTime.getTime() - previousTime.getTime()) / 60000;

  if (!Number.isFinite(minutes) || minutes <= 0) return 0;

  // Negative values are retained so the dashboard can show falling water.
  return Number(((waterLevel - previousLevel) / minutes).toFixed(3));
}

const createReading = asyncHandler(async (req, res) => {
  const reading = validateReadingInput(req.body);
  const createdAt = reading.timestamp || new Date();

  const waterLevelRate = await calculateMeasuredRate(
    reading.deviceId,
    reading.waterLevel,
    createdAt
  );

  const risk = calculateRisk(reading, waterLevelRate);

  const [result] = await pool.query(
    `INSERT INTO drainage_readings
      (device_id, location, latitude, longitude, data_source,
       water_level, rain_level, flow_rate, water_level_rate,
       risk_score, risk_level, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
    [
      reading.deviceId,
      reading.location,
      reading.latitude,
      reading.longitude,
      reading.source,
      reading.waterLevel,
      reading.rainLevel,
      reading.flowRate,
      waterLevelRate,
      risk.score,
      risk.riskLevel,
      createdAt
    ]
  );

  const [rows] = await pool.query('SELECT * FROM drainage_readings WHERE id = ?', [result.insertId]);

  res.status(201).json({
    message: 'Reading stored successfully',
    data: rows[0]
  });
});

const getLatestReading = asyncHandler(async (req, res) => {
  const deviceId = req.query.deviceId || DEFAULT_DEVICE_ID;
  const [rows] = await pool.query(
    'SELECT * FROM drainage_readings WHERE device_id = ? ORDER BY created_at DESC LIMIT 1',
    [deviceId]
  );

  if (!rows.length) throw new ApiError(404, `No readings found for device ${deviceId}`);
  res.status(200).json({ data: rows[0] });
});

const getReadings = asyncHandler(async (req, res) => {
  const { limit, startDate, endDate, deviceId, source } = req.query;
  const conditions = [];
  const params = [];

  if (deviceId) {
    conditions.push('device_id = ?');
    params.push(deviceId);
  }
  if (source) {
    const normalizedSource = String(source).toUpperCase();
    if (!['REAL', 'SIMULATION'].includes(normalizedSource)) {
      throw new ApiError(400, 'source must be REAL or SIMULATION');
    }
    conditions.push('data_source = ?');
    params.push(normalizedSource);
  }
  if (startDate) {
    if (Number.isNaN(Date.parse(startDate))) throw new ApiError(400, 'startDate is not a valid date');
    conditions.push('created_at >= ?');
    params.push(new Date(startDate));
  }
  if (endDate) {
    if (Number.isNaN(Date.parse(endDate))) throw new ApiError(400, 'endDate is not a valid date');
    conditions.push('created_at <= ?');
    params.push(new Date(endDate));
  }

  const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
  let rowLimit = limit === undefined ? 500 : Number(limit);
  if (!Number.isInteger(rowLimit) || rowLimit <= 0 || rowLimit > 5000) {
    throw new ApiError(400, 'limit must be a positive integer up to 5000');
  }

  const sql = `
    SELECT * FROM drainage_readings
    ${where}
    ORDER BY created_at DESC
    LIMIT ?`;
  params.push(rowLimit);

  const [rowsDesc] = await pool.query(sql, params);
  res.status(200).json({ count: rowsDesc.length, data: rowsDesc.slice().reverse() });
});

const getStatus = asyncHandler(async (req, res) => {
  const deviceId = req.query.deviceId || DEFAULT_DEVICE_ID;
  const [rows] = await pool.query(
    'SELECT * FROM drainage_readings WHERE device_id = ? ORDER BY created_at DESC LIMIT 1',
    [deviceId]
  );

  if (!rows.length) {
    return res.status(200).json({
      deviceId,
      location: DEFAULT_LOCATION,
      source: null,
      waterLevel: null,
      flowRate: null,
      rainLevel: null,
      waterLevelRate: null,
      riskScore: null,
      riskLevel: 'NORMAL',
      lastUpdated: null,
      message: 'No readings received yet'
    });
  }

  const latest = rows[0];
  res.status(200).json({
    deviceId: latest.device_id,
    location: latest.location,
    latitude: latest.latitude,
    longitude: latest.longitude,
    source: latest.data_source,
    waterLevel: Number(latest.water_level),
    flowRate: Number(latest.flow_rate),
    rainLevel: Number(latest.rain_level),
    waterLevelRate: Number(latest.water_level_rate),
    riskScore: Number(latest.risk_score),
    riskLevel: latest.risk_level,
    lastUpdated: latest.created_at
  });
});

const getTrendAndPrediction = asyncHandler(async (req, res) => {
  const deviceId = req.query.deviceId || DEFAULT_DEVICE_ID;
  const [rowsDesc] = await pool.query(
    `SELECT water_level, flow_rate, rain_level, water_level_rate, risk_score, risk_level, created_at
     FROM drainage_readings
     WHERE device_id = ?
     ORDER BY created_at DESC LIMIT ?`,
    [deviceId, TREND_WINDOW]
  );

  if (!rowsDesc.length) throw new ApiError(404, `No readings found for device ${deviceId}`);

  const recent = rowsDesc.slice().reverse();
  const trend = calculateTrend(recent);
  const prediction = estimateOverflow(recent);

  res.status(200).json({
    trend,
    prediction: {
      ...prediction,
      disclaimer:
        'Estimated Time to Overflow is a short-term mathematical estimate, not a scientifically validated prediction.'
    },
    currentRisk: recent[recent.length - 1].risk_level,
    currentRiskScore: Number(recent[recent.length - 1].risk_score)
  });
});

module.exports = {
  createReading,
  getLatestReading,
  getReadings,
  getStatus,
  getTrendAndPrediction
};
