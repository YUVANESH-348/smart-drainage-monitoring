# Smart Drainage Monitoring and Overflow Risk Detection System

A college-project prototype built with **React + Node.js/Express + MySQL**, with a
simulator and an experimental MATLAB module. The project is prepared to receive
normalized sensor data from an **ESP32-C3 Super Mini**.

The existing dashboard design, routes, polling approach and major features are
preserved. The hardware path is now:

```text
Rain Sensor ─┐
Ultrasonic ──┼→ ESP32-C3 → calibration/filtering → normalized values
Flow Sensor ─┘                         ↓
                                  Wi-Fi / HTTP
                                       ↓
                              Node.js / Express
                                       ↓
                         prototype risk calculation
                                       ↓
                                    MySQL
                                       ↓
                                React dashboard
```

The simulator uses the same POST contract as the ESP32 and is clearly marked
`SIMULATION`.

## 1. What is measured

- **Rain Intensity:** normalized 0-100 sensor index. It is NOT rainfall in mm.
- **Water Level:** ultrasonic distance converted to normalized 0-100 drainage capacity.
- **Flow Rate:** pulse frequency converted to L/min using a configurable calibration factor.
- **Water-Level Rise Rate:** percentage points per minute, calculated from successive readings.

The backend also stores a **Prototype Risk Score** and `NORMAL / WARNING / HIGH / DANGER`
risk level. This is a configurable engineering heuristic, not a scientifically validated
risk model.

## 2. Project structure

```text
smart-drainage-system/
├── backend/
│   ├── app.js
│   ├── config/db.js
│   ├── controllers/readingController.js
│   ├── middleware/deviceAuth.js
│   ├── middleware/errorHandler.js
│   ├── routes/readingRoutes.js
│   ├── routes/analyticsRoutes.js
│   ├── services/riskService.js
│   └── .env.example
├── database/
│   ├── schema.sql
│   └── migration_v2.sql
├── esp32/
│   ├── SmartDrainageESP32.ino
│   └── HARDWARE_CONNECTIONS.md
├── frontend/
├── simulator/
├── matlab/
└── docs/API.md
```

## 3. Database

### New installation

```bash
mysql -u root -p < database/schema.sql
```

### Existing database from the original project

Back up the database first, then:

```bash
mysql -u root -p smart_drainage < database/migration_v2.sql
```

The migration adds device/location/source metadata, water-level rise rate and
prototype risk score while retaining existing readings.

## 4. Backend

Create/edit `backend/.env`:

```text
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=smart_drainage
CORS_ORIGIN=http://localhost:5173

DEFAULT_DEVICE_ID=DRAIN_001
DEFAULT_LOCATION=Main Gate

DEVICE_API_KEY=change-this-device-key

WATER_WARNING_LEVEL=50
WATER_HIGH_LEVEL=75
WATER_DANGER_LEVEL=90

RISK_WARNING_SCORE=35
RISK_HIGH_SCORE=60
RISK_DANGER_SCORE=80

RISK_WEIGHT_WATER=0.45
RISK_WEIGHT_RAIN=0.20
RISK_WEIGHT_FLOW=0.15
RISK_WEIGHT_RISE_RATE=0.20

FLOW_REFERENCE_LPM=20
RISE_RATE_REFERENCE_PCT_MIN=5
WATER_LEVEL_STABLE_BAND=1.5
```

For multiple devices, use:

```text
DEVICE_KEYS_JSON={"DRAIN_001":"real-key","SIM_001":"sim-key"}
```

When `DEVICE_KEYS_JSON` is present it overrides `DEVICE_API_KEY`.

Run:

```bash
cd backend
npm install
npm start
```

## 5. API

### POST `/api/readings`

Required header:

```text
X-Device-Key: <device key>
```

Request:

```json
{
  "deviceId": "DRAIN_001",
  "location": "Main Gate",
  "source": "REAL",
  "rainLevel": 65,
  "waterLevel": 72,
  "flowRate": 8.4,
  "waterLevelRate": 1.8,
  "timestamp": "2026-09-29T15:44:00.000Z"
}
```

The backend calculates the authoritative stored `water_level_rate` from the
previous reading for the same device. This prevents a bad client-provided rate
from silently controlling the risk calculation.

See `docs/API.md` for the complete response and curl/PowerShell examples.

## 6. Prototype risk calculation

The score combines four inputs:

```text
Water Level        45%
Rain Intensity     20%
Flow Rate          15%
Rise Rate          20%
             ↓
      Prototype Risk Score
             ↓
   NORMAL / WARNING / HIGH / DANGER
```

Water-level thresholds also act as safety floors:

```text
< 50%   NORMAL floor
50%     WARNING floor
75%     HIGH floor
90%     DANGER floor
```

Weights and thresholds are configurable in `.env`.

This is **not scientifically validated** and should not be described as a
guaranteed overflow prediction.

## 7. Estimated Time to Overflow

The existing prediction feature is retained but renamed conceptually as
**Estimated Time to Overflow**.

When the water level is rising and a meaningful positive rise rate exists:

```text
remaining capacity / water-level rise rate
```

is used.

When water is stable, falling, or the rate is unavailable, the dashboard shows:

```text
Overflow estimate unavailable
```

It is a short-term mathematical estimate, not an AI/ML prediction.

## 8. Simulator

The simulator is still useful for development and testing.

```bash
cd simulator
npm install
```

Set the simulator device key to match the backend. For example, with the simple
single-key setup:

```powershell
$env:DEVICE_API_KEY="change-this-device-key"
$env:DEVICE_ID="SIM_001"
node simulator.js
```

Scenarios:

```text
NORMAL
HEAVY_RAIN
HEAVY_FLOW
BLOCKAGE
OVERFLOW
```

Examples:

```powershell
$env:SCENARIO="HEAVY_RAIN"; node simulator.js
$env:SCENARIO="BLOCKAGE"; node simulator.js
$env:SCENARIO="OVERFLOW"; node simulator.js
```

The simulator creates relationships between rain, flow and water level instead
of independently generating random values.

## 9. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

The dashboard retains the original dark instrumentation-style UI and polling
architecture. It now displays:

- Current Water Level
- Rain Intensity
- Flow Rate
- Water-Level Rise Rate
- Prototype Risk Score
- Risk Level
- Estimated Time to Overflow
- Device ID
- Location
- Data source
- Last Updated

If backend polling fails, the dashboard shows an unavailable message instead of
crashing. If the latest reading is older than 60 seconds, it is marked stale.

## 10. ESP32-C3

Open:

```text
esp32/SmartDrainageESP32.ino
```

Set:

- Wi-Fi SSID/password
- backend URL
- device API key
- calibration constants
- GPIO constants

The firmware performs:

1. Rain ADC calibration → 0-100 intensity.
2. Five ultrasonic samples → median filtered distance.
3. Distance → water depth → water level 0-100.
4. Flow pulse counting → pulses/sec → L/min.
5. Water-level rise-rate calculation.
6. Local optional warning/danger outputs.
7. Authenticated HTTP POST to the backend.
8. Latest reading remains in RAM if the network/API fails and is retried later.

See `esp32/HARDWARE_CONNECTIONS.md` for the wiring table and electrical cautions.

**Important:** if an ultrasonic sensor's ECHO output is 5 V, do not connect it
directly to an ESP32-C3 GPIO. Use a suitable level shifter/voltage divider or a
3.3 V-compatible sensor.

## 11. MATLAB

MATLAB remains experimental and separate from the production risk path.

```matlab
data = load_data();
stats = analyze_data(data);
plot_data(data);
result = predict_overflow(data);
model = train_model(data);
```

`train_model.m` remains a Decision Tree experiment. Real historical sensor data
and confirmed overflow-event labels are needed before ML performance can be
treated as meaningful.

## 12. Testing

1. Run MySQL and apply the schema/migration.
2. Start the backend.
3. Test a valid authenticated POST.
4. Test invalid water level (`150`) and confirm HTTP 400.
5. Test missing/incorrect `X-Device-Key` and confirm HTTP 401.
6. Start the simulator and verify `SIMULATION` rows appear.
7. Open the React dashboard.
8. Run `HEAVY_RAIN`, `BLOCKAGE` and `OVERFLOW` scenarios.
9. Confirm water-level rise rate changes with the simulated trend.
10. Stop the simulator/API and confirm the dashboard shows unavailable/stale data.
11. Flash the ESP32 and test each sensor independently before combining them.
12. Test the local alarm outputs only after verifying the selected GPIOs.

## 13. Honesty / project-demo wording

Use:

- **Rain Intensity** — not exact rainfall.
- **Prototype Risk Score** — not scientifically validated.
- **Estimated Time to Overflow** — not guaranteed prediction.
- **Experimental Prediction** — for MATLAB/ML work.
- **REAL DEVICE** vs **SIMULATION** — clearly shown in the dashboard.

Do not claim 100% accurate prediction, scientifically validated risk scoring,
scientific rainfall measurement, or accurate AI prediction without real-world
validation evidence.
