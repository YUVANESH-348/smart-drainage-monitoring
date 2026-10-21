import { useState } from 'react';
import RiskBadge from './RiskBadge';

const zones = [
  {
    id: 'DRAIN_001',
    name: 'Anna Nagar',
    x: 18,
    y: 28,
    risk: 'NORMAL',
    blockage: false,
    waterLevel: 32,
    rain: 28,
    flowRate: 42.5,
    riseRate: 0.4,
    riskScore: 24.5,
  },
  {
    id: 'DRAIN_002',
    name: 'Koyambedu',
    x: 48,
    y: 43,
    risk: 'WARNING',
    blockage: false,
    waterLevel: 56,
    rain: 61,
    flowRate: 31.8,
    riseRate: 1.2,
    riskScore: 48.7,
  },
  {
    id: 'DRAIN_003',
    name: 'Villivakkam',
    x: 78,
    y: 28,
    risk: 'HIGH',
    blockage: true,
    waterLevel: 78,
    rain: 84,
    flowRate: 18.2,
    riseRate: 2.8,
    riskScore: 76.2,
  },
  {
    id: 'DRAIN_004',
    name: 'Egmore',
    x: 70,
    y: 72,
    risk: 'NORMAL',
    blockage: false,
    waterLevel: 39,
    rain: 35,
    flowRate: 37.4,
    riseRate: 0.6,
    riskScore: 29.1,
  },
];

function getRiskClass(risk) {
  switch (risk) {
    case 'WARNING':
      return 'risk-map-warning';

    case 'HIGH':
      return 'risk-map-high';

    case 'DANGER':
      return 'risk-map-danger';

    default:
      return 'risk-map-normal';
  }
}

/* ==========================================
   DYNAMIC WATER FLOW
========================================== */

function WaterFlow({
  slow = false,
  blocked = false,
  flowRate = 40,
  waterLevel = 40,
}) {
  /* Calculate animation speed from flow rate */
  const speed = Math.max(
    0.8,
    Math.min(5, 80 / Math.max(flowRate, 5))
  );

  /* Keep water level between 5% and 100% */
  const level = Math.max(
    5,
    Math.min(100, Number(waterLevel))
  );

  return (
    <div
      className={`water-flow-container ${
        blocked
          ? 'water-flow-container-blocked'
          : ''
      }`}
    >

      {/* Dynamic water level */}

      <div
        className="water-level-fill"
        style={{
          height: `${level}%`,
        }}
      />

      {/* Moving water particles */}

      <div
        className={`water-flow ${
          slow ? 'water-flow-slow' : ''
        } ${
          blocked ? 'water-flow-blocked' : ''
        }`}
        style={{
          animationDuration: `${speed}s`,
        }}
      >
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

    </div>
  );
}

export default function RiskMap({ status }) {

  /* ==========================================
     CURRENT DEVICE
  ========================================== */

  const currentDevice =
    status?.deviceId || 'DRAIN_001';

  /* ==========================================
     UPDATE CURRENT DEVICE DATA
  ========================================== */

  const updatedZones = zones.map((zone) => {

    if (zone.id !== currentDevice) {
      return zone;
    }

    return {
      ...zone,

      risk:
        status?.riskLevel ||
        zone.risk,

      waterLevel:
        status?.waterLevel ??
        zone.waterLevel,

      rain:
        status?.rainLevel ??
        zone.rain,

      flowRate:
        status?.flowRate ??
        zone.flowRate,

      riskScore:
        status?.riskScore ??
        zone.riskScore,

      blockage:
        status?.riskLevel === 'HIGH' ||
        status?.riskLevel === 'DANGER'
          ? true
          : zone.blockage,
    };
  });

  /* ==========================================
     SELECTED ZONE
  ========================================== */

  const [selectedZone, setSelectedZone] =
    useState(
      updatedZones.find(
        (zone) =>
          zone.id === currentDevice
      ) || updatedZones[0]
    );

  /* ==========================================
     ZONE CLICK
  ========================================== */

  const handleZoneClick = (zone) => {
    setSelectedZone(zone);
  };

  return (
    <div className="drainage-risk-map">

      {/* ======================================
          MAP AREA
      ====================================== */}

      <div className="risk-network-area">

        {/* Roads */}

        <div className="network-road road-a" />

        <div className="network-road road-b" />

        <div className="network-road road-c" />


        {/* ====================================
            DRAINAGE CHANNELS
        ==================================== */}

        <div className="drainage-channel channel-main">

          <WaterFlow
            flowRate={
              selectedZone.flowRate
            }
            waterLevel={
              selectedZone.waterLevel
            }
            blocked={
              selectedZone.blockage
            }
          />

        </div>


        <div className="drainage-channel channel-branch">

          <WaterFlow
            slow
            flowRate={
              selectedZone.flowRate
            }
            waterLevel={
              selectedZone.waterLevel
            }
            blocked={
              selectedZone.blockage
            }
          />

        </div>


        <div className="drainage-channel channel-hostel">

          <WaterFlow
            flowRate={
              selectedZone.flowRate
            }
            waterLevel={
              selectedZone.waterLevel
            }
            blocked={
              selectedZone.blockage
            }
          />

        </div>


        {/* ====================================
            BLOCKAGE INDICATOR
        ==================================== */}

        {selectedZone.blockage && (
          <div className="blockage-zone">

            <div className="blockage-symbol">
              ×
            </div>

            <span>
              BLOCKAGE
            </span>

          </div>
        )}


        {/* ====================================
            DRAINAGE NODES
        ==================================== */}

        {updatedZones.map((zone) => (

          <button
            key={zone.id}

            className={`drain-zone ${
              getRiskClass(zone.risk)
            } ${
              selectedZone.id === zone.id
                ? 'selected-zone'
                : ''
            }`}

            style={{
              left: `${zone.x}%`,
              top: `${zone.y}%`,
            }}

            onClick={() =>
              handleZoneClick(zone)
            }
          >

            <div className="zone-pulse" />

            <div className="zone-pin" />

            <div className="zone-label">

              <strong>
                {zone.name}
              </strong>

              <span>
                {zone.id}
              </span>

              {zone.blockage && (
                <b>
                  ⚠ POSSIBLE BLOCKAGE
                </b>
              )}

            </div>

          </button>

        ))}

      </div>


      {/* ======================================
          INFORMATION PANEL
      ====================================== */}

      <div className="risk-network-info">

        {/* Status */}

        <div className="risk-map-status">

          <span>
            SELECTED DRAINAGE ZONE
          </span>

          <RiskBadge
            risk={selectedZone.risk}
          />

        </div>


        {/* Location */}

        <div className="current-zone-title">

          {selectedZone.name}

        </div>


        <div className="current-zone-id">

          {selectedZone.id}

        </div>


        {/* ====================================
            CONDITION
        ==================================== */}

        <div className="zone-condition">

          {selectedZone.blockage ? (
            <>
              <strong>
                ⚠ Possible Drainage Blockage
              </strong>

              <span>
                Water flow is restricted at
                this monitoring point.
              </span>
            </>
          ) : (
            <>
              <strong>
                ✓ Drainage Flow Normal
              </strong>

              <span>
                Water is flowing normally
                through this drainage channel.
              </span>
            </>
          )}

        </div>


        {/* ====================================
            LIVE WATER FLOW
        ==================================== */}

        <div className="flow-indicator">

          <span>
            LIVE WATER FLOW
          </span>

          <div className="flow-line">

            <i />
            <i />
            <i />
            <i />
            <i />

          </div>

          <strong>

            {selectedZone.blockage
              ? 'RESTRICTED'
              : 'FLOWING'}

          </strong>

        </div>


        {/* ====================================
            SENSOR METRICS
        ==================================== */}

        <div className="risk-map-metrics">

          {/* Water level */}

          <div>

            <span>
              WATER LEVEL
            </span>

            <strong>

              {Number(
                selectedZone.waterLevel
              ).toFixed(1)}

              %

            </strong>

          </div>


          {/* Rain */}

          <div>

            <span>
              RAIN
            </span>

            <strong>

              {Number(
                selectedZone.rain
              ).toFixed(0)}

              /100

            </strong>

          </div>


          {/* Flow rate */}

          <div>

            <span>
              FLOW RATE
            </span>

            <strong>

              {Number(
                selectedZone.flowRate
              ).toFixed(1)}

              <small>
                {' '}L/min
              </small>

            </strong>

          </div>


          {/* Rise rate */}

          <div>

            <span>
              RISE RATE
            </span>

            <strong>

              {Number(
                selectedZone.riseRate
              ).toFixed(2)}

              <small>
                {' '}%/min
              </small>

            </strong>

          </div>

        </div>


        {/* ====================================
            WATER LEVEL BAR
        ==================================== */}

        <div className="water-level-panel">

          <div className="water-level-header">

            <span>
              DRAINAGE WATER LEVEL
            </span>

            <strong>
              {Number(
                selectedZone.waterLevel
              ).toFixed(1)}
              %
            </strong>

          </div>

          <div className="water-level-bar">

            <div
              style={{
                width: `${Math.min(
                  Number(
                    selectedZone.waterLevel
                  ),
                  100
                )}%`,
              }}
            />

          </div>

          <div className="water-level-status">

            {Number(
              selectedZone.waterLevel
            ) >= 80 ? (
              <span className="water-critical">
                ⚠ CRITICAL WATER LEVEL
              </span>
            ) : Number(
                selectedZone.waterLevel
              ) >= 60 ? (
                <span className="water-high">
                  HIGH WATER LEVEL
                </span>
              ) : Number(
                selectedZone.waterLevel
              ) >= 40 ? (
                <span className="water-medium">
                  MODERATE WATER LEVEL
                </span>
              ) : (
                <span className="water-normal">
                  NORMAL WATER LEVEL
                </span>
              )}

          </div>

        </div>


        {/* ====================================
            RISK SCORE
        ==================================== */}

        <div className="risk-score-panel">

          <span>
            RISK SCORE
          </span>

          <strong>

            {Number(
              selectedZone.riskScore
            ).toFixed(1)}

          </strong>

          <div className="risk-score-bar">

            <div
              style={{
                width: `${Math.min(
                  Number(
                    selectedZone.riskScore
                  ),
                  100
                )}%`,
              }}
            />

          </div>

        </div>


        {/* ====================================
            LEGEND
        ==================================== */}

        <div className="risk-map-legend">

          <span>

            <i className="legend-dot normal" />

            Normal

          </span>


          <span>

            <i className="legend-dot warning" />

            Warning

          </span>


          <span>

            <i className="legend-dot high" />

            High

          </span>


          <span>

            <i className="legend-dot danger" />

            Danger

          </span>

        </div>

      </div>

    </div>
  );
}