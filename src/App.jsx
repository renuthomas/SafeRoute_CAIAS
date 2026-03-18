import { useEffect, useState } from 'react';
import './App.css';
import './components/ui.css';
import './components/modals.css';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { ToastSystem } from './components/ToastSystem';
import { addToast } from './utils/toast';
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
import MapView from './components/MapView';
import { initFirebaseAuth } from './services/firestore';

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.0060 }; // NYC

function MapPage({ searchQuery, onSearchResult, center, route }) {
  return (
    <div className="map-page" style={{ height: '100%', minHeight: '600px' }}>
      <MapView searchQuery={searchQuery} onSearchResult={onSearchResult} center={center} route={route} />
    </div>
  );
}

function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

export default function App() {
  const [activeTab, setActiveTab] = useState('routes');
  const [searchQuery, setSearchQuery] = useState('');
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [selectedRoute, setSelectedRoute] = useState(null);

  useEffect(() => {
    initFirebaseAuth();
  }, []);

  // Modals
  const [showReport, setShowReport] = useState(false);
  const [showBuddy, setShowBuddy] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleSearch = (query) => {
    setSearchQuery(query);
    setActiveTab('map');
  };

  const handleSearchResult = async (result) => {
    if (result?.location) {
      setMapCenter(result.location);

      // Get user's current location and create a route to the destination
      try {
        const location = await getUserLocation();
        const route = {
          origin: location,
          destination: result.location,
          travelMode: 'WALKING',
        };
        setSelectedRoute(route);
        addToast({
          type: 'success',
          title: 'Route calculated',
          message: 'Showing route from your location to destination with safety information.',
        });
      } catch (error) {
        console.warn('Failed to get user location:', error);
        // Fallback: create route from map center to destination
        const route = {
          origin: mapCenter,
          destination: result.location,
          travelMode: 'WALKING',
        };
        setSelectedRoute(route);
        addToast({
          type: 'warning',
          title: 'Location unavailable',
          message: 'Using map center as starting point. Enable location access for accurate routing.',
        });
      }
    }
  };

  const handleRouteNavigation = (route) => {
    setSelectedRoute(route);
    if (route?.destination) {
      setMapCenter(route.destination);
    }
    setActiveTab('map');
  };

  const handleAlertSelect = (location) => {
    if (!location) return;
    setMapCenter(location);
    setActiveTab('map');
  };

  const pages = {
    routes: <RoutesPage onStartNavigation={handleRouteNavigation} />,
    map: (
      <MapPage
        searchQuery={searchQuery}
        onSearchResult={handleSearchResult}
        center={mapCenter}
        route={selectedRoute}
      />
    ),
    alerts: <AlertsPage onAlertSelect={handleAlertSelect} />,
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
          onSearch={handleSearch}
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
      {showReport && <ReportIncidentModal onClose={() => setShowReport(false)} fallbackLocation={mapCenter} />}
      {showBuddy && <BuddyShareModal onClose={() => setShowBuddy(false)} />}
      {showAlerts && <AlertsModal onClose={() => setShowAlerts(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
}
