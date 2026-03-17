import { useEffect, useState } from 'react';
import { addToast } from '../utils/toast';
import { subscribeToAlerts } from '../services/firestore';
import './AlertsPage.css';
import '../components/ui.css';
import '../components/modals.css';

const DEFAULT_ALERTS = [
  { id: 1, icon: '🚨', type: 'danger', title: 'Downtown Loop — 2 incidents', desc: 'Multiple reports of aggressive behavior near the intersection.', location: 'Downtown Loop', time: '12 min ago' },
  { id: 2, icon: '⚠️', type: 'warning', title: 'Heavy traffic on North Ave', desc: 'Unusual congestion. ETA now 17 min instead of 14 min.', location: 'North Ave', time: '25 min ago' },
  { id: 3, icon: '🚨', type: 'danger', title: 'West Trail — 4+ incidents', desc: 'High incident density this evening. Route marked AVOID.', location: 'West Trail', time: '31 min ago' },
  { id: 4, icon: '💡', type: 'warning', title: 'Poor lighting on West Trail', desc: 'Stretch from 6.1–6.3 mi has inadequate lighting. Avoid after sunset.', location: 'West Trail', time: '45 min ago' },
  { id: 5, icon: '✨', type: 'success', title: 'North Ave — excellent conditions', desc: 'Route improved to 92/100. Well-lit, CCTV coverage, low traffic.', location: 'North Ave', time: '1 hr ago' },
];

const colorMap = {
  danger: { border: 'var(--danger)', badge: 'badge-danger-pill' },
  warning: { border: 'var(--moderate)', badge: 'badge-warning-pill' },
  success: { border: 'var(--safe)', badge: 'badge-success-pill' },
};

export default function AlertsPage({ onAlertSelect }) {
  const [alerts, setAlerts] = useState(DEFAULT_ALERTS);

  useEffect(() => {
    const unsubscribe = subscribeToAlerts((items) => {
      if (items && items.length > 0) {
        setAlerts(items);
        const latest = items[0];
        addToast({ type: latest.type || 'info', title: latest.title || 'New Alert', message: latest.desc || 'New safety alert available.' });
      }
    });

    return () => unsubscribe();
  }, []);

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
                  {a.location && <span>📍 {a.location}</span>}
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
