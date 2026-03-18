import { useEffect, useState } from 'react';
import { addToast } from '../utils/toast';
import { subscribeToIncidents } from '../services/firestore';
import { getUserLocation } from '../utils/geolocation';
import { isWithinRadius } from '../utils/distance';
import './AlertsPage.css';
import '../components/ui.css';
import '../components/modals.css';



const colorMap = {
  danger: { border: 'var(--danger)', badge: 'badge-danger-pill' },
  warning: { border: 'var(--moderate)', badge: 'badge-warning-pill' },
  success: { border: 'var(--safe)', badge: 'badge-success-pill' },
};

const INCIDENT_TYPE_MAP = {
  'harassment': { icon: '🚨', type: 'danger' },
  'assault': { icon: '🚨', type: 'danger' },
  'theft': { icon: '🚨', type: 'danger' },
  'lighting': { icon: '💡', type: 'warning' },
  'poor_lighting': { icon: '💡', type: 'warning' },
  'infrastructure': { icon: '⚠️', type: 'warning' },
  'traffic': { icon: '⚠️', type: 'warning' },
  'other': { icon: '⚠️', type: 'warning' },
};

function getIncidentTypeConfig(type) {
  return INCIDENT_TYPE_MAP[type?.toLowerCase()] || INCIDENT_TYPE_MAP.other;
}

function formatTime(timestamp) {
  if (!timestamp) return 'Just now';
  
  const now = new Date();
  const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  return `${Math.floor(diffHours / 24)} days ago`;
}

function transformIncidentToAlert(incident) {
  const config = getIncidentTypeConfig(incident.type);
  return {
    id: incident.id,
    icon: config.icon,
    type: config.type,
    title: incident.type ? `${incident.type.charAt(0).toUpperCase() + incident.type.slice(1)} Incident` : 'Safety Incident',
    desc: incident.description || 'No description provided',
    location: incident.location ? { lat: incident.location.lat, lng: incident.location.lng } : null,
    time: formatTime(incident.createdAt),
    locationName: 'Near your location',
  };
}

export default function AlertsPage({ onAlertSelect }) {
  const [alerts, setAlerts] = useState( []);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(false);

  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const location = await getUserLocation();
        setUserLocation(location);
        addToast({
          type: 'success',
          title: 'Location Found',
          message: 'Showing incidents within 1km of your current location',
        });
      } catch (error) {
        console.warn('Failed to get user location:', error);
        setLocationError(true);
        addToast({
          type: 'warning',
          title: 'Location Unavailable',
          message: 'Showing all incidents. Enable location for personalized alerts.',
        });
      }
    };

    fetchUserLocation();
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToIncidents((incidents) => {
      if (!incidents || incidents.length === 0) {
        setAlerts();
        return;
      }

      let filteredIncidents = incidents;
      
      if (userLocation) {
        filteredIncidents = incidents.filter(incident => 
          incident.location && 
          isWithinRadius(userLocation, incident.location, 1)
        );
      }

      if (filteredIncidents.length === 0) {
        addToast({
          type: 'info',
          title: 'No Nearby Incidents',
          message: 'No incidents reported within 1km of your location.',
        });
        setAlerts([]);
        return;
      }

      const alertItems = filteredIncidents.map(transformIncidentToAlert);
      setAlerts(alertItems);

      if (alertItems.length > 0) {
        const latest = alertItems[0];
        addToast({
          type: latest.type || 'info',
          title: latest.title || 'New Alert',
          message: `${latest.desc} (${latest.time})`,
        });
      }
    });

    return () => unsubscribe();
  }, [userLocation]);

  const activeCount = alerts.length;
  const activeColor = activeCount > 0 ? 'var(--danger)' : 'var(--text-muted)';

  return (
    <div className="alerts-page-full">
      <div className="ap-header">
        <div>
          <h2 className="ap-title">🔔 Safety Alerts</h2>
          <p className="ap-sub">Real-time incident reports along your routes</p>
        </div>
        <div className="ap-active-badge">
          <span className="live-dot" style={{ background: activeColor }} />
          {activeCount} Active
        </div>
      </div>

      <div className="ap-list">
        {alerts.map((a, i) => {
          const c = colorMap[a.type] || colorMap.warning;
          return (
            <div key={a.id} className="ap-card" style={{ borderLeftColor: c.border, animationDelay: `${i * 60}ms` }}>
              <div className="ap-card-icon">{a.icon || '⚠️'}</div>
              <div className="ap-card-content">
                <div className="ap-card-top">
                  <span className="ap-card-title">{a.title}</span>
                  <span className={`ap-severity ${c.badge}`}>{(a.type || 'info').toUpperCase()}</span>
                </div>
                <p className="ap-card-desc">{a.desc}</p>
                <div className="ap-card-meta">
                  {a.locationName && <span>📍 {a.locationName}</span>}
                  {a.time && <span style={{ marginLeft: 'auto' }}>{a.time}</span>}
                </div>
              </div>
              <button
                className="ap-dismiss"
                onClick={() => addToast({ type: 'info', message: `Alert dismissed: ${a.title}` })}
                title="Dismiss"
              >×</button>
              {a.location && a.location.lat && a.location.lng && onAlertSelect && (
                <button
                  className="ap-focus"
                  onClick={() => onAlertSelect({ lat: a.location.lat, lng: a.location.lng })}
                  title="Focus on map"
                >📍</button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
