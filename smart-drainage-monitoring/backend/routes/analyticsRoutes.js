const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const deviceId = req.query.deviceId;
    const where = deviceId ? 'WHERE device_id = ?' : '';
    const params = deviceId ? [deviceId] : [];

    const [[summary]] = await pool.query(`
      SELECT
        AVG(water_level) AS avgWaterLevel,
        MAX(water_level) AS maxWaterLevel,
        AVG(flow_rate) AS avgFlowRate,
        MAX(flow_rate) AS maxFlowRate,
        AVG(rain_level) AS avgRainLevel,
        MAX(rain_level) AS maxRainLevel,
        AVG(water_level_rate) AS avgWaterLevelRate,
        MAX(water_level_rate) AS maxWaterLevelRate,
        AVG(risk_score) AS avgRiskScore,
        MAX(risk_score) AS maxRiskScore,
        COUNT(*) AS totalReadings,
        SUM(CASE WHEN risk_level = 'WARNING' THEN 1 ELSE 0 END) AS warningCount,
        SUM(CASE WHEN risk_level = 'HIGH' THEN 1 ELSE 0 END) AS highCount,
        SUM(CASE WHEN risk_level = 'DANGER' THEN 1 ELSE 0 END) AS dangerCount
      FROM drainage_readings
      ${where}
    `, params);

    if (!summary || Number(summary.totalReadings) === 0) {
      throw new ApiError(404, 'No readings available to analyze yet');
    }

    const round = (v) => (v === null ? null : Number(Number(v).toFixed(2)));

    res.status(200).json({
      totalReadings: Number(summary.totalReadings),
      waterLevel: { average: round(summary.avgWaterLevel), maximum: round(summary.maxWaterLevel) },
      flowRate: { average: round(summary.avgFlowRate), maximum: round(summary.maxFlowRate) },
      rainfall: { average: round(summary.avgRainLevel), maximum: round(summary.maxRainLevel) },
      waterLevelRate: { average: round(summary.avgWaterLevelRate), maximum: round(summary.maxWaterLevelRate) },
      riskScore: { average: round(summary.avgRiskScore), maximum: round(summary.maxRiskScore) },
      riskCounts: {
        warning: Number(summary.warningCount),
        high: Number(summary.highCount),
        danger: Number(summary.dangerCount)
      }
    });
  })
);

module.exports = router;
