import { useState } from 'react';
import { addToast } from './ToastSystem';
import '../components/ui.css';

function Toggle({ label, sub, defaultChecked }) {
  const [on, setOn] = useState(defaultChecked ?? false);
  return (
    <div className="toggle-row">
      <div>
        <div className="toggle-label">{label}</div>
        {sub && <div className="toggle-sub">{sub}</div>}
      </div>
      <label className="toggle-switch">
        <input type="checkbox" checked={on} onChange={e => setOn(e.target.checked)} />
        <div className="toggle-track" />
      </label>
    </div>
  );
}

export default function SettingsModal({ onClose }) {
  const save = () => {
    addToast({ type: 'success', title: 'Settings saved', message: 'Your preferences have been updated.' });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-md">
        <div className="modal-header">
          <div>
            <div className="modal-title">⚙️ Settings</div>
            <div className="modal-subtitle">Customize your SafeRoute experience</div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Notifications */}
          <div className="section-label">Notifications</div>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '0 14px', marginBottom: 16 }}>
            <Toggle label="Real-time incident alerts" defaultChecked={true} />
            <Toggle label="Route recommendations" defaultChecked={true} />
            <Toggle label="Daily safety score" sub="Get your neighbourhood safety digest" defaultChecked={false} />
            <Toggle label="Buddy share notifications" defaultChecked={true} />
          </div>

          {/* Privacy */}
          <div className="section-label">Privacy & Sharing</div>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '0 14px', marginBottom: 16 }}>
            <Toggle label="Anonymous reporting" sub="Reports you submit will never include your identity" defaultChecked={true} />
            <Toggle label="Share aggregated data with city authorities" sub="Help improve city safety planning" defaultChecked={false} />
            <Toggle label="Allow researchers to use my data" defaultChecked={false} />
          </div>

          {/* Preferences */}
          <div className="section-label">App Preferences</div>
          <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '0 14px', marginBottom: 16 }}>
            <Toggle label="Dark Mode" sub="Currently active" defaultChecked={true} />
            <Toggle label="Notification Sound" defaultChecked={true} />
            <Toggle label="Vibration Alerts" defaultChecked={true} />
          </div>

          {/* Account */}
          <div className="section-label">Account</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => { addToast({ type: 'info', message: 'Logged out successfully.' }); onClose(); }}>
              Log out
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => addToast({ type: 'danger', title: 'Are you sure?', message: 'Account deletion is permanent. Please contact support.' })}>
              Delete Account
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save}>Save Preferences</button>
        </div>
      </div>
    </div>
  );
}
