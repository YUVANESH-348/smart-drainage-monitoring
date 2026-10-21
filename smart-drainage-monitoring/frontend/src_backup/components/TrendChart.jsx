import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { formatShortTime } from '../utils/riskUtils';

export default function TrendChart({ title, data, dataKey, color, unit = '', domain }) {
  const chartData = (data || []).map((row) => ({
    time: row.created_at,
    value: Number(row[dataKey])
  }));

  return (
    <div className="panel graph-panel">
      <h3>{title}</h3>
      {chartData.length === 0 ? (
        <div className="empty-state">No data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 4, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid stroke="#1a2e3d" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              tickFormatter={formatShortTime}
              stroke="#5c7788"
              tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
              minTickGap={30}
            />
            <YAxis
              domain={domain || ['auto', 'auto']}
              stroke="#5c7788"
              tick={{ fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' }}
              width={40}
            />
            <Tooltip
              contentStyle={{
                background: '#101f2c',
                border: '1px solid #21384a',
                borderRadius: 4,
                fontSize: 12,
                fontFamily: 'IBM Plex Mono, monospace'
              }}
              labelFormatter={(v) => formatShortTime(v)}
              formatter={(v) => [`${v}${unit}`, title]}
            />
            <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
