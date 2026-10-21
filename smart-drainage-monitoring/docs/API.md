# API contract

## POST `/api/readings`

Used by both the real ESP32 and the simulator.

### Required header

`X-Device-Key: <configured device key>`

### Request JSON

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

`rainLevel` and `waterLevel` are normalized percentages. `rainLevel` is an
intensity index, not rainfall in millimetres.

`waterLevelRate` is accepted for telemetry, but the backend calculates the
stored rate from its own previous reading for the same device.

### Success response

```json
{
  "message": "Reading stored successfully",
  "data": {
    "id": 42,
    "device_id": "DRAIN_001",
    "location": "Main Gate",
    "data_source": "REAL",
    "water_level": "72.00",
    "rain_level": "65.00",
    "flow_rate": "8.40",
    "water_level_rate": "1.800",
    "risk_score": "64.32",
    "risk_level": "HIGH",
    "created_at": "2026-09-29T15:44:00.000Z"
  }
}
```

### Example curl

PowerShell:

```powershell
$body = @{
  deviceId = "DRAIN_001"
  location = "Main Gate"
  source = "REAL"
  rainLevel = 65
  waterLevel = 72
  flowRate = 8.4
  waterLevelRate = 1.8
  timestamp = (Get-Date).ToUniversalTime().ToString("o")
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:5000/api/readings" `
  -Method Post `
  -Headers @{ "X-Device-Key" = "change-this-device-key" } `
  -ContentType "application/json" `
  -Body $body
```

Command prompt / bash:

```bash
curl -X POST http://localhost:5000/api/readings \
  -H "Content-Type: application/json" \
  -H "X-Device-Key: change-this-device-key" \
  -d '{"deviceId":"DRAIN_001","location":"Main Gate","source":"REAL","rainLevel":65,"waterLevel":72,"flowRate":8.4,"waterLevelRate":1.8}'
```

## Read endpoints

- `GET /api/status?deviceId=DRAIN_001`
- `GET /api/readings/latest?deviceId=DRAIN_001`
- `GET /api/readings?deviceId=DRAIN_001&limit=100`
- `GET /api/readings?source=REAL&limit=100`
- `GET /api/readings/trend?deviceId=DRAIN_001`
- `GET /api/analytics?deviceId=DRAIN_001`

GET endpoints are intentionally unauthenticated for the local dashboard. The
ESP32 write endpoint is authenticated.

## Validation

The POST endpoint rejects:

- missing device ID
- invalid device ID characters
- missing rain/water/flow values
- water level outside 0-100
- rain intensity outside 0-100
- negative flow
- invalid water-level rise rate
- invalid timestamp
- invalid source
- missing or invalid `X-Device-Key`

HTTP errors are JSON such as:

```json
{
  "success": false,
  "message": "waterLevel must be between 0 and 100"
}
```
