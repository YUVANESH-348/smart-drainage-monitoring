import { usePolling } from '../hooks/usePolling';
import api from '../services/api';
import MetricCard from '../components/MetricCard';
import RiskBadge from '../components/RiskBadge';
import SystemStatus from '../components/SystemStatus';
import TrendChart from '../components/TrendChart';
import CombinedTrendChart from '../components/CombinedTrendChart';
import { rainLabel, formatTime } from '../utils/riskUtils';

const POLL_MS = 7000;
const STALE_MS = 60 * 1000;

function accentForRisk(risk) {
  switch (risk) {
    case 'WARNING': return 'warning';
    case 'HIGH': return 'high';
    case 'DANGER': return 'danger';
    default: return 'normal';
  }
}

export default function Dashboard() {
  const status = usePolling(api.getStatus, POLL_MS);
  const trend = usePolling(api.getTrend, POLL_MS);
  const history = usePolling(() => api.getReadings({ limit: 40 }), POLL_MS);
  const s = status.data;
  const t = trend.data;
  const rows = history.data?.data || [];
  const lastUpdatedMs = s?.lastUpdated ? new Date(s.lastUpdated).getTime() : 0;
  const isStale = Boolean(lastUpdatedMs) && Date.now() - lastUpdatedMs > STALE_MS;
  const backendOnline = Boolean(status.data) && !status.error;
  const risk = s?.riskLevel || 'NORMAL';

  return (
    <div className="dashboard-page">
      <div className="topbar">
        <div>
          <div className="eyebrow">CITY INFRASTRUCTURE / DRAINAGE</div>
          <h1>Operations Dashboard</h1>
          <p>Live environmental telemetry and overflow risk monitoring.</p>
        </div>
        <div className="refresh-chip"><span className="pulse-dot online" /> LIVE · {POLL_MS / 1000}s</div>
      </div>

      <SystemStatus backendOnline={backendOnline} lastUpdated={s?.lastUpdated} source={s?.source} deviceId={s?.deviceId} location={s?.location} />

      {status.error && <div className="notice danger-notice">Sensor connection unavailable. The backend API could not be reached.</div>}
      {!status.error && isStale && <div className="notice warning-notice">Last sensor reading is older than 60 seconds. Data may be stale.</div>}
      {!status.error && !s?.lastUpdated && !status.loading && <div className="notice">No readings yet. Start the simulator or connect the ESP32.</div>}

      <section className="hero-grid">
        <div className={`risk-hero risk-${accentForRisk(risk)}`}>
          <div className="hero-heading"><span>CURRENT RISK STATUS</span><span className="hero-time">{formatTime(s?.lastUpdated)}</span></div>
          <div className="risk-main">
            <div className="risk-score">{s ? Number(s.riskScore).toFixed(1) : '—'}<small>/100</small></div>
            <div><RiskBadge risk={risk} /><div className="risk-caption">Prototype composite risk score</div></div>
          </div>
          <div className="risk-meter"><span style={{ width: `${Math.min(100, Math.max(0, Number(s?.riskScore) || 0))}%` }} /></div>
          <div className="risk-scale"><span>NORMAL</span><span>WARNING</span><span>HIGH</span><span>DANGER</span></div>
        </div>
        <div className="overflow-card">
          <div className="card-kicker">FORECAST</div>
          <div className="overflow-title">Estimated time to overflow</div>
          <div className="overflow-value">{t?.prediction?.available ? t.prediction.estimatedMinutes : '—'}<small>{t?.prediction?.available ? ' min' : ''}</small></div>
          <div className="forecast-line"><span className="forecast-dot" /> Short-term mathematical estimate</div>
          <div className="forecast-foot">Based on recent water-level trend</div>
        </div>
      </section>

      <div className="section-heading"><div><span className="section-number">01</span><h2>Live telemetry</h2></div><span>REAL-TIME SENSOR VALUES</span></div>
      <div className="card-grid telemetry-grid">
        <MetricCard label="Water Level" value={s ? Number(s.waterLevel).toFixed(1) : '—'} unit="%" sub="Drain capacity" accent="water" />
        <MetricCard label="Rain Intensity" value={s ? rainLabel(s.rainLevel) : '—'} sub={s ? `${Number(s.rainLevel).toFixed(0)} / 100 normalized` : null} accent="rain" />
        <MetricCard label="Flow Rate" value={s ? Number(s.flowRate).toFixed(1) : '—'} unit="L/min" sub="Current discharge" accent="flow" />
        <MetricCard label="Rise Rate" value={s ? Number(s.waterLevelRate).toFixed(2) : '—'} unit="%/min" sub="Negative = falling" accent="rise" />
      </div>

      <div className="section-heading"><div><span className="section-number">02</span><h2>Trend intelligence</h2></div><span>{rows.length} RECENT READINGS</span></div>
      <TrendChart title="Water Level vs Time" data={rows} dataKey="water_level" color="#37c8d4" unit="%" domain={[0, 100]} />
      <div className="graph-grid">
        <TrendChart title="Flow Rate vs Time" data={rows} dataKey="flow_rate" color="#55c7a0" unit=" L/min" />
        <TrendChart title="Rain Intensity vs Time" data={rows} dataKey="rain_level" color="#f0b95b" unit="" domain={[0, 100]} />
      </div>
      <CombinedTrendChart data={rows} />

      <div className="engineering-note"><strong>Engineering note</strong><span>Prototype Risk Score combines water level, rain intensity, flow rate and water-level rise rate. It is a prototype heuristic, not a scientifically validated safety prediction.</span></div>
    </div>
  );
}
