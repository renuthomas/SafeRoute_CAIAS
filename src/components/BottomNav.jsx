import './BottomNav.css';

export default function BottomNav({ activeTab, onTabChange, onReportIncident }) {
  const items = [
    { id: 'routes', label: 'Routes', icon: '📍' },
    { id: 'map', label: 'Map', icon: '🗺️' },
    { id: 'alert-btn', label: 'Report', icon: '➕', special: true },
    { id: 'buddy', label: 'Buddy', icon: '👥' },
    { id: 'history', label: 'History', icon: '📊' },
  ];

  return (
    <nav className="bottom-nav mobile-only">
      {items.map(item => (
        <button
          key={item.id}
          className={`nav-item ${activeTab === item.id ? 'active' : ''} ${item.special ? 'special' : ''}`}
          onClick={() => item.special ? onReportIncident() : onTabChange(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          {!item.special && <span className="nav-label">{item.label}</span>}
        </button>
      ))}
    </nav>
  );
}
