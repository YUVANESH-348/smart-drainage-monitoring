import { riskClass } from '../utils/riskUtils';

export default function RiskBadge({ risk }) {
  if (!risk) return null;
  return <span className={`risk-badge ${riskClass(risk)}`}>{risk}</span>;
}
