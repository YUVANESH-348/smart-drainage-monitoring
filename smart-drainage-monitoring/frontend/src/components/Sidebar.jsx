import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: '⌂' },
  { to: '/history', label: 'History', icon: '◷' },
  { to: '/alerts', label: 'Alerts', icon: '!' },
  { to: '/system', label: 'System Info', icon: '⚙' },
];

export default function Sidebar({ user, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-logo">SD</div>

        <div>
          <div className="brand-name">SmartDrain</div>
          <div className="brand-version">
            MONITORING SYSTEM · v2.0
          </div>
        </div>
      </div>

      <div className="nav-label">MONITORING</div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              isActive ? 'active' : ''
            }
          >
            <span className="nav-icon">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-spacer" />

      <div className="sidebar-system">
        <div
  style={{
    marginBottom: '18px',
    padding: '12px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.06)',
  }}
>
  <div
    style={{
      fontSize: '11px',
      color: '#94a3b8',
      marginBottom: '4px',
    }}
  >
    LOGGED IN AS
  </div>

  <div
    style={{
      color: '#f8fafc',
      fontWeight: '700',
      fontSize: '14px',
    }}
  >
    {user?.username || 'Admin'}
  </div>

  <div
    style={{
      color: '#64748b',
      fontSize: '11px',
      marginTop: '3px',
    }}
  >
    Role: {user?.role || 'admin'}
  </div>
</div>
        <div className="mini-status">
          <span className="status-dot online" />
          System ready
        </div>

        <div className="sidebar-note">
          Hardware-ready architecture
          <br />
          ESP32 / Sensor telemetry
        </div>

        <button
          onClick={onLogout}
          style={{
            width: '100%',
            marginTop: '18px',
            padding: '10px',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            background: 'rgba(255,255,255,0.08)',
            color: 'white',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}