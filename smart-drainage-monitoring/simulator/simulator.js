// Smart Drainage simulator.
// It uses the same authenticated API contract as the real ESP32.
// Generated values are deliberately correlated, not independent random numbers.

const axios = require('axios');

const SCENARIO = String(process.env.SCENARIO || 'NORMAL').toUpperCase();
const API_URL = process.env.API_URL || 'http://localhost:5000/api/readings';
const DEVICE_KEY = process.env.DEVICE_API_KEY || 'change-this-device-key';
const DEVICE_ID = process.env.DEVICE_ID || 'SIM_001';
const LOCATION = process.env.LOCATION || 'Simulation Drain';
const INTERVAL_MS = Number(process.env.INTERVAL_MS) || 5000;

const state = {
  waterLevel: 20,
  rainLevel: 5,
  flowRate: 3,
  tick: 0
};

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function round2(v) { return Math.round(v * 100) / 100; }
function noise(range) { return (Math.random() * 2 - 1) * range; }

const scenarios = {
  NORMAL(s) {
    s.rainLevel = clamp(s.rainLevel + noise(2), 0, 20);
    const inflow = s.rainLevel * 0.03;
    s.waterLevel = clamp(s.waterLevel + inflow - 0.05 + noise(0.35), 5, 35);
    s.flowRate = clamp(2.0 + s.rainLevel * 0.08 + Math.max(0, s.waterLevel - 20) * 0.03 + noise(0.25), 1, 6);
  },

  HEAVY_RAIN(s) {
    s.rainLevel = clamp(s.rainLevel + 1.5 + noise(1), 0, 95);
    const inflow = 0.35 + s.rainLevel * 0.025;
    const outflow = s.flowRate * 0.015;
    s.waterLevel = clamp(s.waterLevel + inflow - outflow + noise(0.4), 0, 100);
    s.flowRate = clamp(3 + s.rainLevel * 0.13 + noise(0.5), 2, 25);
  },

  HEAVY_FLOW(s) {
    s.rainLevel = clamp(s.rainLevel + 0.5 + noise(1.2), 45, 90);
    s.flowRate = clamp(s.flowRate + 0.7 + noise(0.5), 8, 35);
    s.waterLevel = clamp(s.waterLevel + 0.8 + s.rainLevel * 0.008 - s.flowRate * 0.012 + noise(0.35), 0, 100);
  },

  BLOCKAGE(s) {
    s.rainLevel = clamp(s.rainLevel + 0.4 + noise(1), 35, 65);
    s.flowRate = clamp(s.flowRate - 0.35 + noise(0.15), 0.5, 8);
    // Moderate rain + weak outflow => rapidly rising level.
    s.waterLevel = clamp(s.waterLevel + 1.4 + s.rainLevel * 0.012 - s.flowRate * 0.01 + noise(0.35), 0, 100);
  },

  OVERFLOW(s) {
    s.rainLevel = clamp(s.rainLevel + 1.5 + noise(1), 70, 100);
    s.flowRate = clamp(8 + s.rainLevel * 0.18 + noise(1), 8, 40);
    // Simulates inflow exceeding effective drainage capacity.
    s.waterLevel = clamp(s.waterLevel + 2.8 + s.rainLevel * 0.018 - s.flowRate * 0.012 + noise(0.5), 0, 100);
  }
};

function initialize() {
  const presets = {
    NORMAL: [20, 5, 3],
    HEAVY_RAIN: [35, 60, 10],
    HEAVY_FLOW: [45, 55, 12],
    BLOCKAGE: [45, 40, 3],
    OVERFLOW: [68, 75, 18]
  };
  const [water, rain, flow] = presets[SCENARIO] || presets.NORMAL;
  state.waterLevel = water;
  state.rainLevel = rain;
  state.flowRate = flow;
}

function generateReading() {
  (scenarios[SCENARIO] || scenarios.NORMAL)(state);
  state.tick += 1;

  return {
    deviceId: DEVICE_ID,
    location: LOCATION,
    source: 'SIMULATION',
    rainLevel: round2(state.rainLevel),
    waterLevel: round2(state.waterLevel),
    flowRate: round2(state.flowRate),
    timestamp: new Date().toISOString()
  };
}

async function sendReading() {
  const reading = generateReading();
  console.log(
    `[${new Date().toLocaleTimeString()}] SIMULATION ${SCENARIO} | ` +
    `water=${reading.waterLevel}% | rain=${reading.rainLevel}/100 | flow=${reading.flowRate} L/min`
  );

  try {
    const res = await axios.post(API_URL, reading, {
      timeout: 4000,
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Key': DEVICE_KEY
      }
    });
    const data = res.data?.data;
    console.log(`   -> stored id=${data?.id} | risk=${data?.risk_level} | score=${data?.risk_score}`);
  } catch (err) {
    if (err.response) {
      console.error(`   -> API rejected reading (${err.response.status}): ${err.response.data?.message || 'unknown error'}`);
    } else {
      console.error(`   -> API unavailable: ${err.message}`);
    }
  }
}

initialize();
console.log('==============================================');
console.log(' Smart Drainage Simulator');
console.log('==============================================');
console.log(`Scenario : ${SCENARIO}`);
console.log(`Device   : ${DEVICE_ID} (SIMULATION)`);
console.log(`API      : ${API_URL}`);
console.log(`Interval : ${INTERVAL_MS} ms`);
console.log('Scenarios: NORMAL, HEAVY_RAIN, HEAVY_FLOW, BLOCKAGE, OVERFLOW');
console.log('==============================================');

sendReading();
setInterval(sendReading, INTERVAL_MS);
