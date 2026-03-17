import './Header.css';

export default function Header({ activeTab, notifCount, onBellClick, onProfileClick }) {
  const pageTitle = {
    routes: 'Recommended Routes',
    map: 'Live Map',
    alerts: 'Safety Alerts',
    buddy: 'Buddy Mode',
    history: 'History',
  };

  return (
    <header className="header">
      {/* Breadcrumb + Title */}
      <div className="header-left">
        <div className="header-breadcrumb desktop-only">
          <span className="bc-root">SafeRoute</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          <span className="bc-page">{pageTitle[activeTab] || 'Dashboard'}</span>
        </div>
        <h1 className="header-title">{pageTitle[activeTab] || 'Dashboard'}</h1>
      </div>

      {/* Search */}
      <div className="header-search desktop-only">
        <div className="search-wrap">
          <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="search-input" type="text" placeholder="Search destinations in your city..." id="destination-search"/>
          <kbd className="search-kbd">⌘K</kbd>
        </div>
      </div>

      {/* Actions */}
      <div className="header-actions">
        {/* Live Status */}
        <div className="live-chip">
          <span className="live-dot" />
          Live
        </div>

        {/* Notifications */}
        <button className="header-icon-btn" id="notifications-btn" onClick={onBellClick}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {notifCount > 0 && (
            <span className="icon-badge" style={{ animation: 'pulse 2s ease infinite' }}>{notifCount}</span>
          )}
        </button>

        {/* Avatar */}
        <button className="avatar-btn" id="profile-btn" onClick={onProfileClick}>
          <div className="avatar">G</div>
          <div className="avatar-online" />
        </button>
      </div>
    </header>
  );
}
