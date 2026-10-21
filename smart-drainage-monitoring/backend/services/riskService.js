// backend/services/riskService.js
//
// Prototype, configurable risk calculation. It deliberately combines
// water level, rain intensity, flow rate and water-level rise rate.
// It is NOT scientifically validated.

const THRESHOLDS = {
  WARNING: Number(process.env.WATER_WARNING_LEVEL || 50),
  HIGH: Number(process.env.WATER_HIGH_LEVEL || 75),
  DANGER: Number(process.env.WATER_DANGER_LEVEL || 90)
};

const RISK_SCORE_THRESHOLDS = {
  WARNING: Number(process.env.RISK_WARNING_SCORE || 35),
  HIGH: Number(process.env.RISK_HIGH_SCORE || 60),
  DANGER: Number(process.env.RISK_DANGER_SCORE || 80)
};

const RISK_WEIGHTS = {
  water: Number(process.env.RISK_WEIGHT_WATER || 0.45),
  rain: Number(process.env.RISK_WEIGHT_RAIN || 0.20),
  flow: Number(process.env.RISK_WEIGHT_FLOW || 0.15),
  riseRate: Number(process.env.RISK_WEIGHT_RISE_RATE || 0.20)
};

const FLOW_REFERENCE_LPM = Number(process.env.FLOW_REFERENCE_LPM || 20);
const RISE_RATE_REFERENCE_PCT_MIN = Number(process.env.RISE_RATE_REFERENCE_PCT_MIN || 5);

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function riskFromScore(score) {
  if (score >= RISK_SCORE_THRESHOLDS.DANGER) return 'DANGER';
  if (score >= RISK_SCORE_THRESHOLDS.HIGH) return 'HIGH';
  if (score >= RISK_SCORE_THRESHOLDS.WARNING) return 'WARNING';
  return 'NORMAL';
}

function applyWaterLevelFloor(risk, waterLevel) {
  const order = ['NORMAL', 'WARNING', 'HIGH', 'DANGER'];
  let index = order.indexOf(risk);

  if (waterLevel >= THRESHOLDS.DANGER) index = Math.max(index, 3);
  else if (waterLevel >= THRESHOLDS.HIGH) index = Math.max(index, 2);
  else if (waterLevel >= THRESHOLDS.WARNING) index = Math.max(index, 1);

  return order[index];
}

function calculateRisk(reading, waterLevelRate = 0) {
  const water = clamp(Number(reading.waterLevel));
  const rain = clamp(Number(reading.rainLevel));
  const flow = Math.max(0, Number(reading.flowRate));
  const riseRate = Math.max(0, Number(waterLevelRate) || 0);

  const components = {
    water: water,
    rain,
    flow: clamp((flow / FLOW_REFERENCE_LPM) * 100),
    riseRate: clamp((riseRate / RISE_RATE_REFERENCE_PCT_MIN) * 100)
  };

  const weightSum = Object.values(RISK_WEIGHTS).reduce((sum, value) => sum + value, 0) || 1;
  const score = clamp(
    (components.water * RISK_WEIGHTS.water +
      components.rain * RISK_WEIGHTS.rain +
      components.flow * RISK_WEIGHTS.flow +
      components.riseRate * RISK_WEIGHTS.riseRate) /
      weightSum
  );

  const riskLevel = applyWaterLevelFloor(riskFromScore(score), water);

  return {
    score: Number(score.toFixed(2)),
    riskLevel,
    components
  };
}

function calculateTrend(recentReadings) {
  if (!recentReadings || recentReadings.length < 2) return 'STABLE';

  const first = Number(recentReadings[0].water_level);
  const last = Number(recentReadings[recentReadings.length - 1].water_level);
  const diff = last - first;
  const stableBand = Number(process.env.WATER_LEVEL_STABLE_BAND || 1.5);

  if (diff > stableBand) return 'RISING';
  if (diff < -stableBand) return 'FALLING';
  return 'STABLE';
}

/**
 * Estimate time to 100% from the most recent measured rise rate.
 * A stable/decreasing level intentionally produces no estimate.
 */
function estimateOverflow(recentReadings) {
  if (!recentReadings || recentReadings.length < 2) {
    return { estimatedMinutes: null, ratePerMinute: null, trend: 'STABLE', available: false };
  }

  const last = recentReadings[recentReadings.length - 1];
  const trend = calculateTrend(recentReadings);
  const currentLevel = Number(last.water_level);
  const measuredRate = Number(last.water_level_rate);

  if (trend !== 'RISING' || !Number.isFinite(measuredRate) || measuredRate <= 0) {
    return { estimatedMinutes: null, ratePerMinute: null, trend, available: false };
  }

  const remainingCapacity = Math.max(0, 100 - currentLevel);
  const estimatedMinutes = remainingCapacity / measuredRate;

  return {
    estimatedMinutes: Number(estimatedMinutes.toFixed(1)),
    ratePerMinute: Number(measuredRate.toFixed(2)),
    trend,
    available: true
  };
}

module.exports = {
  THRESHOLDS,
  RISK_SCORE_THRESHOLDS,
  RISK_WEIGHTS,
  FLOW_REFERENCE_LPM,
  RISE_RATE_REFERENCE_PCT_MIN,
  calculateRisk,
  calculateTrend,
  estimateOverflow
};
