import { useEffect, useState, useCallback, useRef } from 'react';
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
import BuddyTrackerPage from './components/BuddyTrackerPage';
import AnalyticsPage from './components/AnalyticsPage';
import BottomNav from './components/BottomNav';
import ReportIncidentModal from './components/ReportIncidentModal';
import BuddyShareModal from './components/BuddyShareModal';
import AlertsModal from './components/AlertsModal';
import SettingsModal from './components/SettingsModal';
import ProfileModal from './components/ProfileModal';
import MapView from './components/MapView';
import { initFirebaseAuth, createBuddySession, addBuddyLocation, endBuddySession } from './services/firestore';

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
  const mapCenterRef = useRef(mapCenter);
  mapCenterRef.current = mapCenter;
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [buddyShare, setBuddyShare] = useState(null);
  const buddyWatchIdRef = useRef(null);
  const autoStopTimerRef = useRef(null);
  const [shareToken, setShareToken] = useState(null);

  useEffect(() => {
    initFirebaseAuth();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('share');
    if (token) {
      setShareToken(token);
      setActiveTab('share');
    }
  }, []);

  // Modals
  const [showReport, setShowReport] = useState(false);
  const [showBuddy, setShowBuddy] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    setActiveTab('map');
  }, []);

  const handleSearchResult = useCallback(async (result) => {
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
          origin: mapCenterRef.current,
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
  }, []);

  const handleRouteNavigation = (route) => {
    setSelectedRoute(route);
    if (route?.destination) {
      setMapCenter(route.destination);
    }
    setActiveTab('map');
  };

  const stopBuddyShare = async () => {
    if (buddyWatchIdRef.current != null) {
      navigator.geolocation.clearWatch(buddyWatchIdRef.current);
      buddyWatchIdRef.current = null;
    }

    if (autoStopTimerRef.current != null) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }

    if (buddyShare?.token) {
      await endBuddySession(buddyShare.token);
    }

    setBuddyShare(null);
    addToast({ type: 'info', title: 'Buddy Share stopped', message: 'Your live route is no longer being shared.' });
  };

  const getAutoEndMs = (durationLabel) => {
    switch (durationLabel) {
      case '15 minutes':
        return 15 * 60 * 1000;
      case '30 minutes':
      case 'Until I arrive':
        return 30 * 60 * 1000;
      case '1 hour':
        return 60 * 60 * 1000;
      case '4 hours':
        return 4 * 60 * 60 * 1000;
      case 'Continuous':
        return null;
      default:
        return 30 * 60 * 1000;
    }
  };

  const startBuddyShare = async ({ contact, sharingMode, duration, route }) => {
    if (autoStopTimerRef.current != null) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }

    const token = typeof crypto?.randomUUID === 'function'
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);

    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${token}`;
    const autoEndMs = getAutoEndMs(duration);
    const expiresAt = autoEndMs ? new Date(Date.now() + autoEndMs) : null;

    setBuddyShare({
      token,
      shareUrl,
      contactName: contact?.name,
      contactPhone: contact?.phone,
      sharingMode,
      duration,
      route,
      startedAt: Date.now(),
      expiresAt: expiresAt?.toISOString(),
    });

    await createBuddySession(token, {
      contactName: contact?.name,
      contactPhone: contact?.phone,
      sharingMode,
      duration,
      route,
      expiresAt: expiresAt ? expiresAt.toISOString() : null,
    });

    if (autoEndMs) {
      autoStopTimerRef.current = window.setTimeout(() => {
        stopBuddyShare();
        addToast({
          type: 'info',
          title: 'Buddy Share ended',
          message: 'Your buddy share session has automatically stopped.',
        });
      }, autoEndMs);
    }

    try {
      const location = await getUserLocation();
      await addBuddyLocation(token, location);
    } catch (err) {
      console.warn('Unable to get initial location for Buddy Share', err);
    }

    if (navigator.geolocation?.watchPosition) {
      buddyWatchIdRef.current = navigator.geolocation.watchPosition(
        async (pos) => {
          const location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          await addBuddyLocation(token, location);
        },
        (err) => {
          console.warn('Buddy Share location update failed', err);
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
      );
    }

    return { token, shareUrl };
  };

  useEffect(() => {
    return () => {
      if (buddyWatchIdRef.current != null) {
        navigator.geolocation.clearWatch(buddyWatchIdRef.current);
      }
      if (autoStopTimerRef.current != null) {
        clearTimeout(autoStopTimerRef.current);
      }
    };
  }, []);

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
    buddy: (
      <BuddyPage
        activeSession={buddyShare}
        onStopSharing={stopBuddyShare}
        shareLink={buddyShare?.shareUrl}
      />
    ),
    share: <BuddyTrackerPage token={shareToken} />,
    history: <AnalyticsPage />,
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'buddy') {
      addToast({ type: 'info', title: 'Buddy Mode', message: 'Manage your trusted contacts and sharing settings here.' });
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
          notifCount={0}
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
      {showBuddy && (
        <BuddyShareModal
          onClose={() => setShowBuddy(false)}
          onActivate={startBuddyShare}
          onStop={stopBuddyShare}
          activeSession={buddyShare}
          currentRoute={selectedRoute}
        />
      )}
      {showAlerts && <AlertsModal onClose={() => setShowAlerts(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
}
