# ESP32-C3 hardware connection

The firmware keeps GPIO constants at the top because ESP32-C3 Super Mini boards
can expose different header layouts.

| Component | Example ESP32-C3 GPIO | Purpose |
|---|---:|---|
| Rain sensor analog output | GPIO0 | ADC input |
| Ultrasonic TRIG | GPIO4 | Trigger output |
| Ultrasonic ECHO | GPIO5 | Echo input |
| Flow sensor pulse | GPIO3 | Interrupt/pulse input |
| Warning LED | disabled (`-1`) | Optional local warning |
| Danger LED | disabled (`-1`) | Optional local danger |
| Buzzer | disabled (`-1`) | Optional local alarm |

## Important electrical notes

1. **Do not feed a 5 V ultrasonic ECHO signal directly into an ESP32-C3 GPIO.**
   If your ultrasonic module outputs 5 V, use a suitable resistor voltage divider
   or a 3.3 V-compatible ultrasonic sensor.
2. Power the sensor modules according to their datasheets.
3. Connect sensor ground and ESP32 ground together.
4. The example GPIOs are configurable. Verify the pin labels on your exact
   ESP32-C3 Super Mini before wiring.
5. GPIO0 is used for the rain sensor because it is ADC-capable on ESP32-C3.
6. The flow sensor must produce a clean pulse signal suitable for a 3.3 V GPIO.
   Use level shifting if its output is higher than 3.3 V.
7. Start with the optional LEDs/buzzer disabled. Enable their GPIO constants only
   after confirming the selected pins are safe on your board.

## Sensor calibration

### Rain sensor
Record raw ADC values for dry, light, moderate, heavy and very-heavy conditions.
Set `RAIN_DRY_RAW` and `RAIN_HEAVY_RAW`. The firmware maps that range to 0-100.
This is an intensity index, not mm of rainfall.

### Ultrasonic
Measure the sensor-to-empty-level distance and set `REFERENCE_HEIGHT_CM`.
The firmware calculates:

`waterDepth = referenceHeight - measuredDistance`

`waterLevelPercentage = waterDepth / referenceHeight * 100`

Five readings are collected and the median of valid readings is used.

### Flow sensor
Find the pulse specification for your actual flow sensor and set
`PULSES_PER_LITER`. The firmware counts pulses and converts frequency to L/min.
Do not assume the example calibration factor is correct for your sensor.
