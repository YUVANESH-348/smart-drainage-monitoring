import { formatTime } from '../utils/riskUtils';

export default function SystemStatus({ backendOnline, lastUpdated, source, deviceId, location }) {
  const hasFreshData = Boolean(lastUpdated);
  return (
    <div className="system-strip">
      <div className="system-live"><span className={`pulse-dot ${backendOnline ? 'online' : 'offline'}`} />{backendOnline ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}</div>
      <div className="system-meta"><span>DATA SOURCE</span><strong>{source === 'SIMULATION' ? 'SIMULATION' : source === 'REAL' ? 'ESP32 DEVICE' : 'UNAVAILABLE'}</strong></div>
      <div className="system-meta"><span>DEVICE</span><strong>{deviceId || '—'}</strong></div>
      <div className="system-meta"><span>LOCATION</span><strong>{location || '—'}</strong></div>
      <div className="system-meta last"><span>LAST SYNC</span><strong className={hasFreshData ? '' : 'muted'}>{formatTime(lastUpdated)}</strong></div>
    </div>
  );
}
