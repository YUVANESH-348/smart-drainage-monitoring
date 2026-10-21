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

  if (filter === 'TODAY') {
    start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
  } else if (filter === 'LAST_24H') {
    start = new Date(
      now.getTime() - 24 * 60 * 60 * 1000
    );
  } else {
    start = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000
    );
  }

  return {
    startDate: start.toISOString(),
    endDate: now.toISOString()
  };
}

export default function History() {
  const [filter, setFilter] = useState('LAST_24H');

  const params = useMemo(
    () => ({
      ...rangeFor(filter),
      limit: 300
    }),
    [filter]
  );

  const readings = usePolling(
    () => api.getReadings(params),
    8000,
    [filter]
  );

  const rows = (readings.data?.data || [])
    .slice()
    .reverse();

  /* ==============================
     SUMMARY CALCULATIONS
  ============================== */

  const normalCount = rows.filter(
    (r) => r.risk_level === 'NORMAL'
  ).length;

  const warningCount = rows.filter(
    (r) => r.risk_level === 'WARNING'
  ).length;

  const highDangerCount = rows.filter(
    (r) =>
      r.risk_level === 'HIGH' ||
      r.risk_level === 'DANGER'
  ).length;

  const averageWater =
    rows.length > 0
      ? rows.reduce(
          (sum, r) => sum + Number(r.water_level || 0),
          0
        ) / rows.length
      : 0;

  return (
    <div>

      {/* PAGE HEADER */}

      <div className="page-header">
        <div>
          <h1>History</h1>

          <div className="subtitle">
            Historical drainage readings and prototype risk trends
          </div>
        </div>

        <div className="refresh-chip">
          <span className="pulse-dot online" />
          AUTO REFRESH · 8s
        </div>
      </div>


      {/* FILTERS */}

      <div className="filter-bar">
        {Object.entries(FILTERS).map(
          ([key, label]) => (
            <button
              key={key}
              className={`filter-btn ${
                filter === key ? 'active' : ''
              }`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          )
        )}
      </div>


      {/* SUMMARY CARDS */}

      <div className="history-summary-grid">

        <div className="history-summary-card">
          <span>READINGS</span>
          <strong>{rows.length}</strong>
          <small>Collected samples</small>
        </div>

        <div className="history-summary-card normal">
          <span>NORMAL</span>
          <strong>{normalCount}</strong>
          <small>Within normal range</small>
        </div>

        <div className="history-summary-card warning">
          <span>WARNING</span>
          <strong>{warningCount}</strong>
          <small>Moderate risk readings</small>
        </div>

        <div className="history-summary-card danger">
          <span>HIGH / DANGER</span>
          <strong>{highDangerCount}</strong>
          <small>Elevated risk readings</small>
        </div>

        <div className="history-summary-card water">
          <span>AVG WATER LEVEL</span>
          <strong>{averageWater.toFixed(1)}%</strong>
          <small>Selected time range</small>
        </div>

      </div>


      {/* CHARTS */}

      <div className="section-heading">
        <div>
          <span className="section-number">01</span>
          <h2>Historical Trends</h2>
        </div>

        <span>
          {FILTERS[filter].toUpperCase()}
        </span>
      </div>

      <div className="graph-grid">

        <TrendChart
          title="Water Level vs Time"
          data={readings.data?.data}
          dataKey="water_level"
          color="#2fb6c4"
          unit="%"
          domain={[0, 100]}
        />

        <TrendChart
          title="Flow Rate vs Time"
          data={readings.data?.data}
          dataKey="flow_rate"
          color="#3fb68b"
          unit=" L/min"
        />

      </div>


      {/* TABLE */}

      <div className="section-heading">
        <div>
          <span className="section-number">02</span>
          <h2>Sensor Readings</h2>
        </div>

        <span>
          {rows.length} RECORDS
        </span>
      </div>


      <div className="panel">

        {readings.loading && (
          <div className="loading-text">
            Loading historical readings...
          </div>
        )}

        {readings.error && (
          <div className="error-text">
            Failed to load history.
            Check the backend connection.
          </div>
        )}

        {!readings.loading &&
          rows.length === 0 && (
            <div className="empty-state">
              No readings in this time range.
            </div>
          )}

        {rows.length > 0 && (
          <div className="table-wrap">

            <table className="history-table">

              <thead>
                <tr>
                  <th>TIME</th>
                  <th>DEVICE</th>
                  <th>SOURCE</th>
                  <th>WATER</th>
                  <th>RAIN</th>
                  <th>FLOW</th>
                  <th>RISE RATE</th>
                  <th>RISK SCORE</th>
                  <th>RISK</th>
                </tr>
              </thead>

              <tbody>

                {rows.map((r) => (
                  <tr key={r.id}>

                    <td>
                      {formatTime(r.created_at)}
                    </td>

                    <td>
                      {r.device_id}
                    </td>

                    <td>
                      {r.data_source}
                    </td>

                    <td>
                      {Number(
                        r.water_level
                      ).toFixed(1)}
                      %
                    </td>

                    <td>
                      {Number(
                        r.rain_level
                      ).toFixed(0)}
                      /100
                    </td>

                    <td>
                      {Number(
                        r.flow_rate
                      ).toFixed(1)}
                      {' '}L/min
                    </td>

                    <td>
                      {Number(
                        r.water_level_rate
                      ).toFixed(2)}
                      %/min
                    </td>

                    <td>
                      {Number(
                        r.risk_score
                      ).toFixed(1)}
                    </td>

                    <td>
                      <RiskBadge
                        risk={r.risk_level}
                      />
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </div>


      {/* ENGINEERING NOTE */}

      <div className="engineering-note">

        <strong>Data note</strong>

        <span>
          Historical readings are retrieved from the SmartDrain
          backend database. Risk values represent the prototype
          composite risk calculation for the selected time range.
        </span>

      </div>

    </div>
  );
}