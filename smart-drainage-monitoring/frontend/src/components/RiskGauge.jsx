export default function RiskGauge({ value = 0, risk = 'NORMAL' }) {
  const score = Math.min(100, Math.max(0, Number(value) || 0));
  const angle = -90 + (score / 100) * 180;
  const riskClass = risk.toLowerCase();

  return (
    <div className={`risk-gauge risk-gauge-${riskClass}`} aria-label={`Risk score ${score.toFixed(1)} out of 100`}>
      <div className="gauge-ring">
        <div className="gauge-inner">
          <strong>{score.toFixed(1)}</strong>
          <span>/ 100</span>
        </div>
        <span className="gauge-needle" style={{ transform: `rotate(${angle}deg)` }} />
      </div>
      <div className="gauge-scale"><span>SAFE</span><span>CRITICAL</span></div>
    </div>
  );
}
