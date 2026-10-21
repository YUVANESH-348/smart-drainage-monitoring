-- Smart Drainage Monitoring and Overflow Risk Detection System
-- Fresh installation schema.

CREATE DATABASE IF NOT EXISTS smart_drainage
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_drainage;

CREATE TABLE IF NOT EXISTS drainage_devices (
  device_id VARCHAR(64) PRIMARY KEY,
  location VARCHAR(255) NOT NULL DEFAULT 'Main Gate',
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS drainage_readings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  device_id VARCHAR(64) NOT NULL DEFAULT 'DRAIN_001',
  location VARCHAR(255) NOT NULL DEFAULT 'Main Gate',
  latitude DECIMAL(10,7) NULL,
  longitude DECIMAL(10,7) NULL,
  data_source VARCHAR(20) NOT NULL DEFAULT 'REAL',
  water_level DECIMAL(6,2) NOT NULL COMMENT 'Normalized drainage capacity percentage 0-100',
  rain_level DECIMAL(6,2) NOT NULL COMMENT 'Normalized rain intensity 0-100; not rainfall mm',
  flow_rate DECIMAL(8,2) NOT NULL COMMENT 'Flow rate in L/min',
  water_level_rate DECIMAL(8,3) NOT NULL DEFAULT 0 COMMENT 'Water-level change in percentage points/min',
  risk_score DECIMAL(6,2) NOT NULL DEFAULT 0 COMMENT 'Prototype risk score 0-100',
  risk_level VARCHAR(20) NOT NULL COMMENT 'NORMAL | WARNING | HIGH | DANGER',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_source CHECK (data_source IN ('REAL', 'SIMULATION')),
  CONSTRAINT chk_water_level CHECK (water_level BETWEEN 0 AND 100),
  CONSTRAINT chk_rain_level CHECK (rain_level BETWEEN 0 AND 100),
  CONSTRAINT chk_flow_rate CHECK (flow_rate >= 0),
  INDEX idx_device_time (device_id, created_at),
  INDEX idx_created_at (created_at),
  CONSTRAINT fk_reading_device
    FOREIGN KEY (device_id) REFERENCES drainage_devices(device_id)
) ENGINE=InnoDB;

INSERT INTO drainage_devices (device_id, location)
VALUES ('DRAIN_001', 'Main Gate')
ON DUPLICATE KEY UPDATE location = VALUES(location);

-- Optional demo rows for a fresh database.
INSERT INTO drainage_readings
  (device_id, location, data_source, water_level, rain_level, flow_rate, water_level_rate, risk_score, risk_level, created_at)
VALUES
  ('DRAIN_001', 'Main Gate', 'REAL', 22.50, 10.00, 3.20, 0.00, 15.00, 'NORMAL', NOW() - INTERVAL 10 MINUTE),
  ('DRAIN_001', 'Main Gate', 'REAL', 28.00, 15.00, 3.80, 0.92, 20.14, 'NORMAL', NOW() - INTERVAL 8 MINUTE),
  ('DRAIN_001', 'Main Gate', 'REAL', 35.40, 20.00, 4.50, 1.23, 25.68, 'NORMAL', NOW() - INTERVAL 6 MINUTE),
  ('DRAIN_001', 'Main Gate', 'REAL', 48.10, 35.00, 5.90, 1.73, 36.74, 'WARNING', NOW() - INTERVAL 4 MINUTE),
  ('DRAIN_001', 'Main Gate', 'REAL', 55.70, 48.00, 7.20, 2.28, 46.66, 'WARNING', NOW() - INTERVAL 2 MINUTE);
