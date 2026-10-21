export default function MetricCard({ label, value, unit, accent = '', sub, children }) {
  return (
    <div className={`metric-card ${accent ? `accent-${accent}` : ''}`}>
      <div className="metric-top"><span className="metric-label">{label}</span><span className="metric-line" /></div>
      <div className="metric-value">{value}{unit ? <span>{unit}</span> : null}</div>
      {children}
      {sub ? <div className="metric-sub">{sub}</div> : null}
    </div>
  );
}
