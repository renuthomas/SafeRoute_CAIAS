import { addToast } from './ToastSystem';

const ALERTS_DATA = [
  {
    id: 1,
    icon: '🚨',
    title: 'Downtown Loop — 2 incidents in last 2 hours',
    time: '12 minutes ago',
    desc: 'Multiple reports of aggressive behavior near the intersection.',
    action: 'View Route',
    actionType: 'danger',
  },
  {
    id: 2,
    icon: '✨',
    title: 'Better route available',
    time: '5 minutes ago',
    desc: 'North Ave now has excellent conditions (92/100). Consider switching from West Trail (32/100).',
    action: 'Switch Route',
    actionType: 'success',
  },
  {
    id: 3,
    icon: '💡',
    title: 'Poor lighting detected',
    time: 'Just now',
    desc: 'West Trail segment (6.1–6.3 mi) has inadequate lighting. Avoid after sunset.',
    action: 'Avoid Segment',
    actionType: 'warning',
  },
];

export default function AlertsModal({ onClose }) {
  const handleAction = (alert) => {
    const msgs = {
      'View Route': { type: 'info', message: `Highlighting Downtown Loop on the map.` },
      'Switch Route': { type: 'success', message: `Switched to North Ave — looking great! 🌟` },
      'Avoid Segment': { type: 'warning', message: `West Trail segment (6.1–6.3 mi) marked to avoid.` },
    };
    const m = msgs[alert.action];
    if (m) addToast({ type: m.type, title: alert.action, message: m.message });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-lg">
        <div className="modal-header">
          <div>
            <div className="modal-title">🔔 Safety Alerts</div>
            <div className="modal-subtitle">3 active alerts on your routes</div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="modal-body">
          {ALERTS_DATA.map((a, i) => (
            <div
              key={a.id}
              className="alert-card"
              style={{
                animationDelay: `${i * 80}ms`,
                borderLeftColor: a.actionType === 'danger' ? 'var(--danger)' : a.actionType === 'success' ? 'var(--safe)' : 'var(--moderate)',
              }}
            >
              <div className="alert-card-icon">{a.icon}</div>
              <div className="alert-card-content">
                <div className="alert-card-header">
                  <span className="alert-card-title">{a.title}</span>
                  <span className="alert-card-time">{a.time}</span>
                </div>
                <p className="alert-card-desc">{a.desc}</p>
                <button
                  className={`btn btn-sm btn-${a.actionType === 'danger' ? 'danger' : a.actionType === 'success' ? 'success' : 'secondary'}`}
                  onClick={() => handleAction(a)}
                  style={{ marginTop: 6 }}
                >
                  {a.action}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" style={{ fontSize: 12 }}>Mark all as read</button>
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
