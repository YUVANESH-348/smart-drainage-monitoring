-- Migration from the original project schema to the hardware-ready schema.
-- Run this ONCE against an existing smart_drainage database.
-- Make a backup first.

USE smart_drainage;

CREATE TABLE IF NOT EXISTS drainage_devices (
  device_id VARCHAR(64) PRIMARY KEY,
  location VARCHAR(255) NOT NULL DEFAULT 'Main Gate',
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO drainage_devices (device_id, location)
VALUES ('DRAIN_001', 'Main Gate')
ON DUPLICATE KEY UPDATE location = VALUES(location);

-- For the original schema supplied with this project, these columns do not exist.
ALTER TABLE drainage_readings
  ADD COLUMN device_id VARCHAR(64) NOT NULL DEFAULT 'DRAIN_001' AFTER id,
  ADD COLUMN location VARCHAR(255) NOT NULL DEFAULT 'Main Gate' AFTER device_id,
  ADD COLUMN latitude DECIMAL(10,7) NULL AFTER location,
  ADD COLUMN longitude DECIMAL(10,7) NULL AFTER latitude,
  ADD COLUMN data_source VARCHAR(20) NOT NULL DEFAULT 'REAL' AFTER longitude,
  ADD COLUMN water_level_rate DECIMAL(8,3) NOT NULL DEFAULT 0 AFTER flow_rate,
  ADD COLUMN risk_score DECIMAL(6,2) NOT NULL DEFAULT 0 AFTER water_level_rate;

UPDATE drainage_readings
SET risk_score =
  LEAST(100, GREATEST(0, water_level * 0.45 + rain_level * 0.20 + LEAST(flow_rate / 20 * 100, 100) * 0.15)),
    data_source = 'REAL',
    location = 'Main Gate',
    device_id = 'DRAIN_001';

ALTER TABLE drainage_readings
  ADD INDEX idx_device_time (device_id, created_at);

ALTER TABLE drainage_readings
  ADD CONSTRAINT fk_reading_device
  FOREIGN KEY (device_id) REFERENCES drainage_devices(device_id);

-- NOTE:
-- The original database has no historical timestamps precise enough to
-- reconstruct a trustworthy rise rate for every row. New readings will
-- receive calculated water_level_rate values automatically.
