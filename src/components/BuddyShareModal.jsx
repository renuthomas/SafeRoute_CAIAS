import { useState } from 'react';
import { addToast } from '../utils/toast';
import '../components/ui.css';

const CONTACTS = [
  { id: 1, name: 'Mom', phone: '+91 98765 43210', emoji: '👩' },
  { id: 2, name: 'Sister', phone: '+91 99887 76655', emoji: '👧' },
  { id: 3, name: 'Best Friend', phone: '+91 91234 56789', emoji: '🤝' },
];

const SHARING_OPTIONS = [
  { id: 'route', label: 'Route only', sub: 'Share just your planned route' },
  { id: 'live', label: 'Real-time location + route', sub: 'They see your live position on map' },
];

const DURATION_OPTIONS = [
  'Until I arrive',
  '4 hours',
  'Continuous',
];

export default function BuddyShareModal({ onClose }) {
  const [selectedContact, setSelectedContact] = useState(null);
  const [sharingMode, setSharingMode] = useState('live');
  const [duration, setDuration] = useState('Until I arrive');
  const [activated, setActivated] = useState(false);

  const activate = () => {
    if (!selectedContact) return;
    setActivated(true);
    setTimeout(() => {
      const contact = CONTACTS.find(c => c.id === selectedContact);
      addToast({
        type: 'success',
        title: 'Buddy Share Activated!',
        message: `🎯 ${contact.name} will receive a notification and can track your live location. You can stop sharing anytime.`,
      });
      onClose();
    }, 1800);
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-md">
        <div className="modal-header">
          <div>
            <div className="modal-title">👥 Start Buddy Share</div>
            <div className="modal-subtitle">Someone always knows where you are</div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {activated ? (
          <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px 40px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--safe)', marginBottom: 8 }}>Buddy Share Activated!</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {CONTACTS.find(c => c.id === selectedContact)?.name} will receive a notification and can track your live location.
              <br/><strong>Stay safe! You can stop sharing anytime.</strong>
            </div>
          </div>
        ) : (
          <>
            <div className="modal-body">
              {/* Contacts */}
              <div className="form-group">
                <label className="form-label">Select Trusted Contact</label>
                <div className="contact-list">
                  {CONTACTS.map(c => (
                    <div
                      key={c.id}
                      className={`contact-item ${selectedContact === c.id ? 'selected' : ''}`}
                      onClick={() => setSelectedContact(c.id)}
                    >
                      <span className="contact-emoji">{c.emoji}</span>
                      <div className="contact-info">
                        <span className="contact-name">{c.name}</span>
                        <span className="contact-phone">{c.phone}</span>
                      </div>
                      {selectedContact === c.id && (
                        <span className="contact-check">✓</span>
                      )}
                    </div>
                  ))}
                  <button className="add-contact-btn">
                    <span>+</span> Add New Contact
                  </button>
                </div>
              </div>

              {/* How it works */}
              <div className="info-box" style={{ marginBottom: 16 }}>
                <strong>How it works:</strong> Your contact will see your live location and route in real-time. They'll be notified if you deviate from your path or if incidents occur on your route.
              </div>

              {/* Sharing options */}
              <div className="form-group">
                <label className="form-label">Sharing Options</label>
                {SHARING_OPTIONS.map(opt => (
                  <label key={opt.id} className="sharing-option">
                    <input
                      type="radio"
                      name="sharing"
                      value={opt.id}
                      checked={sharingMode === opt.id}
                      onChange={() => setSharingMode(opt.id)}
                      className="form-checkbox"
                    />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{opt.sub}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Duration */}
              <div className="form-group">
                <label className="form-label">Duration</label>
                <select className="form-select" value={duration} onChange={e => setDuration(e.target.value)}>
                  {DURATION_OPTIONS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-teal"
                onClick={activate}
                disabled={!selectedContact}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Enable Buddy Share
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
