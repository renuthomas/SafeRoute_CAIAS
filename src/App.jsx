import { useState } from 'react';
import './App.css';
import './components/ui.css';
import './components/modals.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { ToastSystem, addToast } from './components/ToastSystem';
import RoutesPage from './components/RoutesPage';
import AlertsPage from './components/AlertsPage';
import BuddyPage from './components/BuddyPage';
import AnalyticsPage from './components/AnalyticsPage';
import BottomNav from './components/BottomNav';
import ReportIncidentModal from './components/ReportIncidentModal';
import BuddyShareModal from './components/BuddyShareModal';
import AlertsModal from './components/AlertsModal';
import SettingsModal from './components/SettingsModal';
import ProfileModal from './components/ProfileModal';

function MapPage() {
  return (
    <div className="placeholder-page">
      <div className="ph-content">
        <div style={{ fontSize: 64 }}>🗺️</div>
        <h2>Full Map View</h2>
        <p>Interactive city map with real-time safety overlays coming soon</p>
        <button className="btn btn-primary" onClick={() => addToast({ type: 'info', message: 'Full map with Google Maps / Mapbox integration is coming in the next update!' })}>
          Get Notified
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('routes');

  // Modals
  const [showReport, setShowReport] = useState(false);
  const [showBuddy, setShowBuddy] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const pages = {
    routes: <RoutesPage />,
    map: <MapPage />,
    alerts: <AlertsPage />,
    buddy: <BuddyPage />,
    history: <AnalyticsPage />,
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'buddy') {
      addToast({ type: 'info', title: 'Buddy Mode', message: 'Manage your trusted contacts and sharing settings here.' });
    }
    if (tab === 'alerts') {
      addToast({ type: 'warning', title: '3 Active Alerts', message: 'Incidents reported on West Trail and Downtown Loop in the last 2 hours.' });
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onReportIncident={() => setShowReport(true)}
        onBuddyShare={() => setShowBuddy(true)}
        onSettings={() => setShowSettings(true)}
      />

      <div className="app-main">
        <Header
          activeTab={activeTab}
          notifCount={3}
          onBellClick={() => setShowAlerts(true)}
          onProfileClick={() => setShowProfile(true)}
        />
        <main className="app-content">
          {pages[activeTab]}
        </main>
      </div>

      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onReportIncident={() => setShowReport(true)}
      />

      {/* Toast System */}
      <ToastSystem />

      {/* Modals */}
      {showReport && <ReportIncidentModal onClose={() => setShowReport(false)} />}
      {showBuddy && <BuddyShareModal onClose={() => setShowBuddy(false)} />}
      {showAlerts && <AlertsModal onClose={() => setShowAlerts(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
}
