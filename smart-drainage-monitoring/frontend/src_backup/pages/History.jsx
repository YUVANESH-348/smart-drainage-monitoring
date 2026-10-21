import { useState, useMemo } from 'react';
import { usePolling } from '../hooks/usePolling';
import api from '../services/api';
import RiskBadge from '../components/RiskBadge';
import TrendChart from '../components/TrendChart';
import { formatTime } from '../utils/riskUtils';

const FILTERS = {
  TODAY: 'Today',
  LAST_24H: 'Last 24 hours',
  LAST_7D: 'Last 7 days'
};

function rangeFor(filter) {
  const now = new Date();
  let start;
  if (filter === 'TODAY') start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  else if (filter === 'LAST_24H') start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  else start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { startDate: start.toISOString(), endDate: now.toISOString() };
}

export default function History() {
  const [filter, setFilter] = useState('LAST_24H');
  const params = useMemo(() => ({ ...rangeFor(filter), limit: 300 }), [filter]);
  const readings = usePolling(() => api.getReadings(params), 8000, [filter]);
  const rows = (readings.data?.data || []).slice().reverse();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>History</h1>
          <div className="subtitle">Historical drainage readings and prototype risk trends</div>
        </div>
      </div>

      <div className="filter-bar">
        {Object.entries(FILTERS).map(([key, label]) => (
          <button key={key} className={`filter-btn ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>
            {label}
          </button>
        ))}
      </div>

      <div className="graph-grid">
        <TrendChart title="Water Level vs Time" data={readings.data?.data} dataKey="water_level" color="#2fb6c4" unit="%" domain={[0, 100]} />
        <TrendChart title="Flow Rate vs Time" data={readings.data?.data} dataKey="flow_rate" color="#3fb68b" unit=" L/min" />
      </div>

      <div className="panel" style={{ marginTop: 6 }}>
        <h3 style={{ margin: '0 0 14px', fontSize: 13, color: 'var(--color-text-muted)' }}>READINGS ({rows.length})</h3>
        {readings.loading && <div className="loading-text">Loading…</div>}
        {readings.error && <div className="error-text">Failed to load history. Check the backend connection.</div>}
        {!readings.loading && rows.length === 0 && <div className="empty-state">No readings in this time range.</div>}

        {rows.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Device</th>
                  <th>Source</th>
                  <th>Water</th>
                  <th>Rain</th>
                  <th>Flow</th>
                  <th>Rise Rate</th>
                  <th>Risk Score</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{formatTime(r.created_at)}</td>
                    <td>{r.device_id}</td>
                    <td>{r.data_source}</td>
                    <td>{Number(r.water_level).toFixed(1)}%</td>
                    <td>{Number(r.rain_level).toFixed(0)}/100</td>
                    <td>{Number(r.flow_rate).toFixed(1)} L/min</td>
                    <td>{Number(r.water_level_rate).toFixed(2)}%/min</td>
                    <td>{Number(r.risk_score).toFixed(1)}</td>
                    <td><RiskBadge risk={r.risk_level} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
