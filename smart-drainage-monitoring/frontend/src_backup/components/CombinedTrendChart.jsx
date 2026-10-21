import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { formatShortTime } from '../utils/riskUtils';

export default function CombinedTrendChart({ data }) {
  const chartData = (data || []).map((row) => ({
    time: row.created_at,
    waterLevel: Number(row.water_level),
    rainLevel: Number(row.rain_level)
  }));

  return (
    <div className="panel graph-panel">
      <h3>Combined Drainage Trend</h3>
      {chartData.length === 0 ? (
        <div className="empty-state">No data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
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
              domain={[0, 100]}
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
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="waterLevel"
              name="Water Level (%)"
              stroke="#2fb6c4"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="rainLevel"
              name="Rain Level"
              stroke="#e2a33d"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 3"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
