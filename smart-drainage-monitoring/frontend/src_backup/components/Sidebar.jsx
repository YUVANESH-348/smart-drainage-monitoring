import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', icon: '⌂' },
  { to: '/history', label: 'History', icon: '◷' },
  { to: '/alerts', label: 'Alerts', icon: '!' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-logo">SD</div>
        <div>
          <div className="brand-name">SmartDrain</div>
          <div className="brand-version">MONITORING SYSTEM · v2.0</div>
        </div>
      </div>

      <div className="nav-label">MONITORING</div>
      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.to === '/'} className={({ isActive }) => isActive ? 'active' : ''}>
            <span className="nav-icon">{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-spacer" />
      <div className="sidebar-system">
        <div className="mini-status"><span className="status-dot online" /> System ready</div>
        <div className="sidebar-note">Hardware-ready architecture<br />ESP32 / Sensor telemetry</div>
      </div>
    </aside>
  );
}
