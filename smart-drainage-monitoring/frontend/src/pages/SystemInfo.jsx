export default function SystemInfo() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>System Information</h1>
          <div className="subtitle">
            SmartDrain system configuration and monitoring details
          </div>
        </div>

        <div className="refresh-chip">
          <span className="pulse-dot online" />
          SYSTEM ONLINE
        </div>
      </div>

      <div className="section-heading">
        <div>
          <span className="section-number">01</span>
          <h2>Device Information</h2>
        </div>
        <span>ESP32 MONITORING UNIT</span>
      </div>

      <div className="info-grid">
        <div className="info-card">
          <span>DEVICE ID</span>
          <strong>DRAIN_001</strong>
        </div>

        <div className="info-card">
          <span>LOCATION</span>
          <strong>Main Gate</strong>
        </div>

        <div className="info-card">
          <span>CONTROLLER</span>
          <strong>ESP32-C3</strong>
        </div>

        <div className="info-card">
          <span>BACKEND</span>
          <strong>Node.js / Express</strong>
        </div>
      </div>

      <div className="section-heading">
        <div>
          <span className="section-number">02</span>
          <h2>Sensor Configuration</h2>
        </div>
        <span>LIVE TELEMETRY SOURCES</span>
      </div>

      <div className="sensor-info-grid">
        <div className="sensor-info-card">
          <div className="sensor-icon">WL</div>
          <div>
            <strong>Water Level Sensor</strong>
            <span>Monitors drainage water level</span>
          </div>
          <b>ACTIVE</b>
        </div>

        <div className="sensor-info-card">
          <div className="sensor-icon">RN</div>
          <div>
            <strong>Rain Sensor</strong>
            <span>Measures rainfall intensity</span>
          </div>
          <b>ACTIVE</b>
        </div>

        <div className="sensor-info-card">
          <div className="sensor-icon">FL</div>
          <div>
            <strong>Flow Sensor</strong>
            <span>Monitors drainage flow rate</span>
          </div>
          <b>ACTIVE</b>
        </div>

        <div className="sensor-info-card">
          <div className="sensor-icon">RT</div>
          <div>
            <strong>Rise Rate Analysis</strong>
            <span>Calculates water-level change</span>
          </div>
          <b>ACTIVE</b>
        </div>
      </div>

      <div className="section-heading">
        <div>
          <span className="section-number">03</span>
          <h2>System Architecture</h2>
        </div>
        <span>SOFTWARE + HARDWARE</span>
      </div>

      <div className="architecture-panel">
        <div className="architecture-step">
          <span>01</span>
          <strong>ESP32-C3</strong>
          <small>Sensor acquisition</small>
        </div>

        <div className="architecture-arrow">→</div>

        <div className="architecture-step">
          <span>02</span>
          <strong>Node.js API</strong>
          <small>Data processing</small>
        </div>

        <div className="architecture-arrow">→</div>

        <div className="architecture-step">
          <span>03</span>
          <strong>MySQL</strong>
          <small>Data storage</small>
        </div>

        <div className="architecture-arrow">→</div>

        <div className="architecture-step">
          <span>04</span>
          <strong>React UI</strong>
          <small>Visualization</small>
        </div>
      </div>

      <div className="engineering-note">
        <strong>Prototype status</strong>
        <span>
          SmartDrain is currently configured as a college project
          prototype. Sensor readings, risk calculations and alerts
          are intended for demonstration and monitoring purposes.
        </span>
      </div>
    </div>
  );
}