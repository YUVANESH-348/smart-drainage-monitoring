/*
  Smart Drainage Monitoring - ESP32-C3 Super Mini

  Hardware:
    - Analog rain sensor module
    - HC-SR04-style ultrasonic sensor (ECHO MUST be <= 3.3 V at ESP32)
    - Pulse-output water-flow sensor
    - Optional warning/danger LED and buzzer

  IMPORTANT:
    rainLevel is a normalized 0-100 sensor intensity, NOT rainfall in mm.
    waterLevel is calculated from calibrated distance/reference height.
    flowRate is calculated from pulse frequency and a configurable factor.

  Before flashing:
    1. Set WIFI_SSID / WIFI_PASSWORD.
    2. Set BACKEND_URL to a URL reachable by the ESP32 (not localhost).
    3. Set DEVICE_API_KEY to the backend's DEVICE_API_KEY.
    4. Set calibration constants for your actual sensors.
    5. Set GPIO constants for your exact ESP32-C3 Super Mini board.
*/

#include <WiFi.h>
#include <HTTPClient.h>

// ----------------------------- Network ---------------------------------
const char* WIFI_SSID = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* BACKEND_URL = "http://192.168.1.100:5000/api/readings";
const char* DEVICE_API_KEY = "change-this-device-key";
const char* DEVICE_ID = "DRAIN_001";
const char* LOCATION = "Main Gate";

// ----------------------------- GPIO ------------------------------------
// These are configurable examples, not a claim that every C3 Super Mini
// board exposes the same header layout.
const int RAIN_SENSOR_PIN = 0;       // ADC-capable GPIO
const int ULTRASONIC_TRIG_PIN = 4;   // digital output
const int ULTRASONIC_ECHO_PIN = 5;   // digital input
const int FLOW_SENSOR_PIN = 3;       // pulse input

// Optional local safety outputs. Set to -1 to disable.
const int WARNING_LED_PIN = -1;
const int DANGER_LED_PIN = -1;
const int BUZZER_PIN = -1;

// ----------------------------- Rain calibration ------------------------
// Calibrate these with YOUR rain sensor/module. Many modules have an
// inverse ADC response, so dry/wet endpoints must be measured.
// Use serial output to record raw values under each condition.
const int RAIN_DRY_RAW = 3000;          // raw ADC at dry condition
const int RAIN_HEAVY_RAW = 1000;        // raw ADC at heavy-rain condition

// ----------------------------- Water calibration -----------------------
// Mount the ultrasonic sensor above the water surface.
// referenceHeightCm = distance from sensor to empty/reference water level.
// water depth = referenceHeightCm - measuredDistanceCm.
const float REFERENCE_HEIGHT_CM = 30.0;
const float WARNING_LEVEL_PERCENT = 50.0;
const float HIGH_RISK_LEVEL_PERCENT = 75.0;
const float OVERFLOW_LEVEL_PERCENT = 90.0;

// ----------------------------- Flow calibration ------------------------
// Replace this with the pulse specification from YOUR flow sensor.
// Example structure: flow L/min = pulsesPerSecond / PULSES_PER_LITER.
const float PULSES_PER_LITER = 7.5;

// ----------------------------- Timing/filtering -------------------------
const unsigned long SENSOR_INTERVAL_MS = 5000;
const unsigned long HTTP_TIMEOUT_MS = 1500;
const int ULTRASONIC_SAMPLE_COUNT = 5;
const float MAX_VALID_DISTANCE_CM = 400.0;

volatile unsigned long flowPulseCount = 0;
unsigned long lastSensorMillis = 0;
unsigned long lastFlowMillis = 0;

float previousWaterLevel = NAN;
unsigned long previousLevelMillis = 0;

struct Reading {
  float rainLevel;
  float waterLevel;
  float flowRate;
  float waterLevelRate;
  String timestamp;
};

Reading pendingReading;
bool hasPendingReading = false;

void IRAM_ATTR onFlowPulse() {
  flowPulseCount++;
}

float clampFloat(float value, float minimum, float maximum) {
  return max(minimum, min(maximum, value));
}

float medianOf(float values[], int count) {
  for (int i = 0; i < count - 1; i++) {
    for (int j = i + 1; j < count; j++) {
      if (values[j] < values[i]) {
        float temp = values[i];
        values[i] = values[j];
        values[j] = temp;
      }
    }
  }
  return values[count / 2];
}

float readRainIntensity() {
  int raw = analogRead(RAIN_SENSOR_PIN);

  // Map the calibrated dry/heavy endpoints to 0-100.
  // With the common inverse-response modules, lower raw value means wetter.
  float intensity = 100.0 * (float)(RAIN_DRY_RAW - raw) /
                    (float)(RAIN_DRY_RAW - RAIN_HEAVY_RAW);

  intensity = clampFloat(intensity, 0.0, 100.0);

  Serial.printf("Rain raw=%d -> intensity=%.1f/100\n", raw, intensity);
  return intensity;
}

float readDistanceCmOnce() {
  digitalWrite(ULTRASONIC_TRIG_PIN, LOW);
  delayMicroseconds(3);
  digitalWrite(ULTRASONIC_TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(ULTRASONIC_TRIG_PIN, LOW);

  unsigned long duration = pulseIn(ULTRASONIC_ECHO_PIN, HIGH, 30000UL);
  if (duration == 0) return NAN;

  float distance = (duration * 0.0343f) / 2.0f;
  if (distance <= 0 || distance > MAX_VALID_DISTANCE_CM) return NAN;
  return distance;
}

float readFilteredDistanceCm() {
  float samples[ULTRASONIC_SAMPLE_COUNT];
  int valid = 0;

  for (int i = 0; i < ULTRASONIC_SAMPLE_COUNT; i++) {
    float distance = readDistanceCmOnce();
    if (isfinite(distance)) {
      samples[valid++] = distance;
    }
    delay(25);
  }

  if (valid == 0) return NAN;
  return medianOf(samples, valid);
}

float distanceToWaterLevel(float distanceCm) {
  if (!isfinite(distanceCm)) return NAN;

  float depth = REFERENCE_HEIGHT_CM - distanceCm;
  float percentage = (depth / REFERENCE_HEIGHT_CM) * 100.0f;
  return clampFloat(percentage, 0.0f, 100.0f);
}

float readFlowRateLpm() {
  unsigned long now = millis();
  unsigned long elapsed = now - lastFlowMillis;
  if (elapsed == 0) return 0;

  noInterrupts();
  unsigned long pulses = flowPulseCount;
  flowPulseCount = 0;
  interrupts();

  lastFlowMillis = now;

  float pulsesPerSecond = pulses / (elapsed / 1000.0f);
  float litersPerMinute = (pulsesPerSecond / PULSES_PER_LITER) * 60.0f;

  Serial.printf("Flow pulses=%lu -> %.2f L/min\n", pulses, litersPerMinute);
  return max(0.0f, litersPerMinute);
}

float calculateWaterLevelRate(float currentLevel, unsigned long nowMillis) {
  if (!isfinite(previousWaterLevel) || previousLevelMillis == 0) {
    previousWaterLevel = currentLevel;
    previousLevelMillis = nowMillis;
    return 0.0f;
  }

  float minutes = (nowMillis - previousLevelMillis) / 60000.0f;
  if (minutes <= 0) return 0.0f;

  float rate = (currentLevel - previousWaterLevel) / minutes;
  previousWaterLevel = currentLevel;
  previousLevelMillis = nowMillis;

  return rate;
}

void updateLocalSafetyOutputs(float waterLevel) {
  if (WARNING_LED_PIN >= 0) {
    digitalWrite(WARNING_LED_PIN, waterLevel >= WARNING_LEVEL_PERCENT ? HIGH : LOW);
  }

  if (DANGER_LED_PIN >= 0) {
    digitalWrite(DANGER_LED_PIN, waterLevel >= OVERFLOW_LEVEL_PERCENT ? HIGH : LOW);
  }

  if (BUZZER_PIN >= 0) {
    digitalWrite(BUZZER_PIN, waterLevel >= OVERFLOW_LEVEL_PERCENT ? HIGH : LOW);
  }
}

Reading readSensors() {
  Reading r;
  r.rainLevel = readRainIntensity();

  float distance = readFilteredDistanceCm();
  r.waterLevel = distanceToWaterLevel(distance);

  if (!isfinite(r.waterLevel)) {
    Serial.println("Ultrasonic reading invalid; keeping previous water level.");
    r.waterLevel = isfinite(previousWaterLevel) ? previousWaterLevel : 0.0f;
  }

  r.flowRate = readFlowRateLpm();
  r.waterLevelRate = calculateWaterLevelRate(r.waterLevel, millis());
  r.timestamp = String(millis()); // replaced with ISO timestamp only if time sync is added

  Serial.printf(
    "Normalized -> water=%.1f%% rain=%.1f/100 flow=%.2f L/min rise=%.2f %%/min\n",
    r.waterLevel, r.rainLevel, r.flowRate, r.waterLevelRate
  );

  updateLocalSafetyOutputs(r.waterLevel);
  return r;
}

bool connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return true;

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting Wi-Fi");
  unsigned long started = millis();

  while (WiFi.status() != WL_CONNECTED && millis() - started < 10000) {
    delay(250);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("Wi-Fi IP: ");
    Serial.println(WiFi.localIP());
    return true;
  }

  Serial.println("Wi-Fi unavailable; reading will remain buffered for retry.");
  return false;
}

String isoTimestampOrFallback() {
  // For a simple college prototype, server time is authoritative when the
  // ESP32 sends no valid clock. The backend accepts timestamp optionally.
  // This function therefore returns an empty string unless you add NTP.
  return "";
}

bool sendReading(const Reading& r) {
  if (!connectWiFi()) return false;

  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);
  if (!http.begin(BACKEND_URL)) {
    Serial.println("HTTP begin failed.");
    return false;
  }

  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_API_KEY);

  // Constants come from the firmware, so simple JSON construction is enough
  // here and avoids requiring an extra Arduino library.
  String body = "{";
  body += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  body += "\"location\":\"" + String(LOCATION) + "\",";
  body += "\"source\":\"REAL\",";
  body += "\"rainLevel\":" + String(r.rainLevel, 2) + ",";
  body += "\"waterLevel\":" + String(r.waterLevel, 2) + ",";
  body += "\"flowRate\":" + String(r.flowRate, 2) + ",";
  body += "\"waterLevelRate\":" + String(r.waterLevelRate, 3);
  body += "}";

  int status = http.POST(body);
  String response = http.getString();
  http.end();

  if (status >= 200 && status < 300) {
    Serial.printf("API accepted reading: HTTP %d\n", status);
    hasPendingReading = false;
    return true;
  }

  Serial.printf("API send failed: HTTP %d | %s\n", status, response.c_str());
  return false;
}

void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(ULTRASONIC_TRIG_PIN, OUTPUT);
  pinMode(ULTRASONIC_ECHO_PIN, INPUT);
  pinMode(FLOW_SENSOR_PIN, INPUT_PULLUP);

  if (WARNING_LED_PIN >= 0) pinMode(WARNING_LED_PIN, OUTPUT);
  if (DANGER_LED_PIN >= 0) pinMode(DANGER_LED_PIN, OUTPUT);
  if (BUZZER_PIN >= 0) pinMode(BUZZER_PIN, OUTPUT);

  analogReadResolution(12);
  attachInterrupt(digitalPinToInterrupt(FLOW_SENSOR_PIN), onFlowPulse, FALLING);

  connectWiFi();
  lastSensorMillis = millis();
  lastFlowMillis = millis();

  Serial.println("Smart Drainage ESP32-C3 started.");
}

void loop() {
  unsigned long now = millis();

  if (now - lastSensorMillis >= SENSOR_INTERVAL_MS) {
    lastSensorMillis = now;

    // Always read sensors and update local safety logic first.
    pendingReading = readSensors();
    hasPendingReading = true;

    // If the network fails, this latest reading remains in RAM and is retried
    // on the next sensor cycle. This avoids introducing an on-device database.
    if (hasPendingReading) {
      sendReading(pendingReading);
    }
  }

  // Keep the loop responsive to Wi-Fi changes.
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }
}
