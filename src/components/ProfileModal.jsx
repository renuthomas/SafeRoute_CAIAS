import { addToast } from '../utils/toast';
import '../components/ui.css';

export default function ProfileModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-sm">
        <div className="modal-header">
          <div>
            <div className="modal-title">👤 Your Profile</div>
            <div className="modal-subtitle">Anonymous Navigator</div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Anonymous avatar */}
          <div style={{ textAlign: 'center', padding: '10px 0 20px' }}>
            <div className="profile-avatar-large">G</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginTop: 12 }}>Guest User</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>Anonymous Navigator</div>
          </div>

          {/* Stats */}
          <div className="profile-stats-card">
            {[
              { label: 'Routes Checked', value: '12', icon: '📍' },
              { label: 'Safety Reports', value: '4', icon: '⚠️' },
              { label: 'Community Contribution', value: 'High', icon: '💙' },
              { label: 'Last Active', value: '2 hrs ago', icon: '🕐' },
            ].map(s => (
              <div key={s.label} className="profile-stat-item">
                <span className="psi-icon">{s.icon}</span>
                <div>
                  <div className="psi-value">{s.value}</div>
                  <div className="psi-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Anon note */}
          <div className="info-box" style={{ margin: '16px 0', fontSize: 13 }}>
            You're browsing SafeRoute <strong>anonymously</strong>. Sign up to save your favourite routes and enable Buddy Mode with contacts.
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button className="btn btn-teal btn-full" onClick={() => { addToast({ type: 'info', message: 'Account creation coming soon! 💙' }); onClose(); }}>
              Create Account
            </button>
            <button className="btn btn-secondary btn-full" onClick={onClose}>
              Continue as Guest
            </button>
            <button className="btn btn-danger btn-full btn-sm" onClick={() => { addToast({ type: 'info', message: 'Logged out. Thank you for using SafeRoute!' }); onClose(); }}>
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
