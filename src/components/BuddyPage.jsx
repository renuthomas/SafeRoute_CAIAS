import { addToast } from '../utils/toast';
import './BuddyPage.css';
import '../components/ui.css';
import '../components/modals.css';

export default function BuddyPage({ activeSession, onStopSharing, shareLink }) {
  return (
    <div className="buddy-page">
      <div className="buddy-hero">
        <div className="buddy-icon-wrap">
          <span style={{ fontSize: 56 }}>👥</span>
        </div>
        <h2 className="buddy-title">Buddy Mode</h2>
        <p className="buddy-sub">
          Share your live location with trusted contacts while navigating.<br/>
          Someone always knows where you are.
        </p>

        {activeSession ? (
          <div style={{ width: '100%', maxWidth: 460, textAlign: 'center' }}>
            <div className="info-box" style={{ marginBottom: 16 }}>
              <strong>Sharing with:</strong> {activeSession.contactName || 'Trusted contact'}
              <br />
              <strong>Link:</strong> <code style={{ fontSize: 12, wordBreak: 'break-all' }}>{shareLink || activeSession.shareUrl}</code>
            </div>
            <button
              className="btn btn-danger btn-lg"
              onClick={() => onStopSharing?.()}
            >
              Stop Buddy Share
            </button>
          </div>
        ) : (
          <button
            className="btn btn-teal btn-lg"
            onClick={() => addToast({ type: 'info', title: 'Buddy Mode', message: 'Click "Start Buddy Share" in the sidebar to activate!' })}
          >
            Start Buddy Share
          </button>
        )}
      </div>

      <div className="buddy-features">
        {[
          { icon: '📍', title: 'Real-time Tracking', desc: 'Contacts see your live position on map as you navigate.' },
          { icon: '🔔', title: 'Incident Alerts', desc: 'Your buddy gets notified if incidents occur on your route.' },
          { icon: '🛤️', title: 'Route Deviation', desc: 'Alert sent if you deviate significantly from planned path.' },
          { icon: '🔒', title: 'Privacy First', desc: 'Location deleted after session ends. No data retention.' },
        ].map((f, i) => (
          <div key={i} className="feature-card" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="fc-icon">{f.icon}</div>
            <div className="fc-title">{f.title}</div>
            <div className="fc-desc">{f.desc}</div>
          </div>
        ))}
      </div>

      <div className="buddy-contacts">
        <div className="section-label">Saved Contacts (3)</div>
        {[
          { name: 'Mom', phone: '+91 98765 43210', status: 'Available', emoji: '👩' },
          { name: 'Sister', phone: '+91 99887 76655', status: 'Available', emoji: '👧' },
          { name: 'Best Friend', phone: '+91 91234 56789', status: 'Do not disturb', emoji: '🤝' },
        ].map((c, i) => (
          <div key={i} className="contact-row">
            <span style={{ fontSize: 20 }}>{c.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{c.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{c.phone}</div>
            </div>
            <span className={`contact-status ${c.status === 'Available' ? 'status-ok' : 'status-dnd'}`}>
              {c.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
