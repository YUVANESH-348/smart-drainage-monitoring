export const RISK_COLORS = {
  NORMAL: '#3fb68b',
  WARNING: '#e2a33d',
  HIGH: '#e2793d',
  DANGER: '#e2493d'
};

export function riskClass(risk) {
  return `risk-${String(risk || 'normal').toLowerCase()}`;
}

export function rainLabel(rainLevel) {
  if (rainLevel === null || rainLevel === undefined) return '—';
  if (rainLevel <= 20) return 'No / Light';
  if (rainLevel <= 50) return 'Moderate';
  if (rainLevel <= 80) return 'Heavy';
  return 'Very Heavy';
}

export function formatTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    day: '2-digit', month: 'short'
  });
}

export function formatShortTime(value) {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function alertMessageFor(risk) {
  switch (risk) {
    case 'WARNING': return { icon: '⚠️', text: 'Estimated overflow risk has entered the warning range. Continue monitoring.' };
    case 'HIGH': return { icon: '⚠️', text: 'Estimated overflow risk is high. Inspect drainage conditions.' };
    case 'DANGER': return { icon: '🚨', text: 'Estimated overflow risk is in the danger range. Check the physical drainage system.' };
    default: return null;
  }
}
