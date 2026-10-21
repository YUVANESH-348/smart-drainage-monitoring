import { usePolling } from '../hooks/usePolling';
import api from '../services/api';
import { alertMessageFor, formatTime, riskClass } from '../utils/riskUtils';

export default function Alerts() {
  const readings = usePolling(() => api.getReadings({ limit: 100 }), 7000);

  const rows = (readings.data?.data || []).slice().reverse();

  const alerts = rows.filter(
    (r) => r.risk_level !== 'NORMAL'
  );

  const dangerCount = alerts.filter(
    (r) => r.risk_level === 'DANGER'
  ).length;

  const highCount = alerts.filter(
    (r) => r.risk_level === 'HIGH'
  ).length;

  const warningCount = alerts.filter(
    (r) => r.risk_level === 'WARNING'
  ).length;

  return (
    <div>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1>Alerts</h1>

          <div className="subtitle">
            Real-time drainage risk alerts generated from sensor telemetry.
          </div>
        </div>

        <div className="refresh-chip">
          <span className="pulse-dot online" />
          LIVE · 7s
        </div>
      </div>

      {/* ALERT SUMMARY */}
      <div className="alert-summary-grid">

        <div className="alert-summary-card">
          <span className="summary-label">TOTAL ALERTS</span>
          <strong>{alerts.length}</strong>
          <span className="summary-note">
            Recent risk events
          </span>
        </div>

        <div className="alert-summary-card warning">
          <span className="summary-label">WARNING</span>
          <strong>{warningCount}</strong>
          <span className="summary-note">
            Moderate risk
          </span>
        </div>

        <div className="alert-summary-card high">
          <span className="summary-label">HIGH</span>
          <strong>{highCount}</strong>
          <span className="summary-note">
            Elevated risk
          </span>
        </div>

        <div className="alert-summary-card danger">
          <span className="summary-label">DANGER</span>
          <strong>{dangerCount}</strong>
          <span className="summary-note">
            Critical prototype risk
          </span>
        </div>

      </div>

      {/* STATUS */}
      {readings.loading && (
        <div className="loading-text">
          Loading alerts...
        </div>
      )}

      {readings.error && (
        <div className="error-text">
          Failed to load alerts. Check the backend connection.
        </div>
      )}

      {/* NO ALERTS */}
      {!readings.loading && alerts.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>
            ✓
          </div>

          <strong>No active alerts</strong>

          <div style={{ marginTop: '6px' }}>
            Recent readings are within the normal prototype range.
          </div>
        </div>
      )}

      {/* ALERT LIST */}
      {alerts.length > 0 && (
        <>
          <div className="section-heading">
            <div>
              <span className="section-number">01</span>
              <h2>Recent Risk Events</h2>
            </div>

            <span>
              {alerts.length} ALERT{alerts.length !== 1 ? 'S' : ''}
            </span>
          </div>

          {alerts.map((r) => {
            const msg = alertMessageFor(r.risk_level);

            if (!msg) return null;

            return (
              <div
                key={r.id}
                className={`alert-item ${riskClass(r.risk_level)}`}
              >
                <span className="icon">
                  {msg.icon}
                </span>

                <div className="body">

                  <div className="message">
                    {msg.text}
                  </div>

                  <div className="meta">
                    {r.risk_level}
                    {' · '}
                    score {Number(r.risk_score).toFixed(1)}
                    {' · '}
                    water {Number(r.water_level).toFixed(1)}%
                    {' · '}
                    rise {Number(r.water_level_rate).toFixed(2)}%/min
                    {' · '}
                    {formatTime(r.created_at)}
                  </div>

                </div>

                <div className="alert-status">
                  {r.risk_level}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* ENGINEERING NOTE */}
      <div className="engineering-note">
        <strong>Alert logic</strong>

        <span>
          Alerts are generated from the prototype risk level
          calculated from drainage sensor readings. This system
          does not currently send SMS, email, or external emergency
          notifications.
        </span>
      </div>
    </div>
  );
}