import { usePolling } from '../hooks/usePolling';
import api from '../services/api';
import { alertMessageFor, formatTime, riskClass } from '../utils/riskUtils';

export default function Alerts() {
  const readings = usePolling(() => api.getReadings({ limit: 100 }), 7000);
  const rows = (readings.data?.data || []).slice().reverse();
  const alerts = rows.filter((r) => r.risk_level !== 'NORMAL');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Alerts</h1>
          <div className="subtitle">
            Dashboard alerts generated from the prototype risk level. No SMS/email is sent.
          </div>
        </div>
      </div>

      {readings.loading && <div className="loading-text">Loading…</div>}
      {readings.error && <div className="error-text">Failed to load alerts. Check the backend connection.</div>}
      {!readings.loading && alerts.length === 0 && (
        <div className="empty-state">No alerts. Recent readings are within the normal prototype range.</div>
      )}

      {alerts.map((r) => {
        const msg = alertMessageFor(r.risk_level);
        if (!msg) return null;
        return (
          <div key={r.id} className={`alert-item ${riskClass(r.risk_level)}`}>
            <span className="icon">{msg.icon}</span>
            <div className="body">
              <div className="message">{msg.text}</div>
              <div className="meta">
                {r.risk_level} · score {Number(r.risk_score).toFixed(1)} · water {Number(r.water_level).toFixed(1)}% · rise {Number(r.water_level_rate).toFixed(2)}%/min · {formatTime(r.created_at)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
