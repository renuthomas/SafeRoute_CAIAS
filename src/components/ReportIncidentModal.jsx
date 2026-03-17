import { useEffect, useState } from 'react';
import { addToast } from '../utils/toast';
import { reportIncident } from '../services/firestore';
import '../components/ui.css';

export default function ReportIncidentModal({ onClose, fallbackLocation }) {
  const [type, setType] = useState('');
  const [desc, setDesc] = useState('');
  const [anon, setAnon] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const supportsGeolocation = typeof navigator !== 'undefined' && !!navigator.geolocation;
  const [location, setLocation] = useState(fallbackLocation || null);
  const [locationStatus, setLocationStatus] = useState(
    fallbackLocation ? 'fallback' : supportsGeolocation ? 'detecting' : 'unsupported',
  );

  useEffect(() => {
    if (!fallbackLocation) return;
    setLocation(fallbackLocation);
    setLocationStatus('fallback');
  }, [fallbackLocation]);

  useEffect(() => {
    if (!supportsGeolocation) return;

    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('ready');
      },
      (err) => {
        console.warn('Geolocation error', err);
        setLocationStatus('failed');
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 10000 },
    );

    return () => navigator.geolocation.clearWatch(watcher);
  }, [supportsGeolocation]);

  const submit = async (e) => {
    e.preventDefault();
    if (!type) return;
    setSubmitted(true);

    try {
      await reportIncident({
        type,
        description: desc,
        anonymous: anon,
        location,
      });

      addToast({
        type: 'success',
        title: 'Incident Reported!',
        message: 'Your report has been submitted anonymously. Thank you for making SafeRoute safer for everyone. 💙',
      });
      onClose();
    } catch (error) {
      console.error('Failed to report incident', error);
      addToast({
        type: 'danger',
        title: 'Report Failed',
        message: 'We could not submit your report. Please try again.',
      });
      setSubmitted(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-md">
        <div className="modal-header">
          <div>
            <div className="modal-title">⚠️ Report Incident</div>
            <div className="modal-subtitle">Help keep your community safe</div>
          </div>
          <button className="modal-close" onClick={onClose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {submitted ? (
          <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px 40px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--safe)', marginBottom: 8 }}>Report submitted!</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Your report has been submitted anonymously and will help other users.<br/>
              <strong>Thank you for making SafeRoute safer for everyone.</strong>
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="modal-body">
              {/* Anon note */}
              <div className="info-box" style={{ marginBottom: 18 }}>
                🔒 You're reporting anonymously. No personal data is attached to this report.
              </div>

              <div className="form-group">
                <label className="form-label">Incident Type <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select
                  className="form-select"
                  value={type}
                  onChange={e => setType(e.target.value)}
                  required
                >
                  <option value="">Select incident type...</option>
                  <option value="harassment">Harassment</option>
                  <option value="lighting">Poor Lighting</option>
                  <option value="traffic">Traffic Concern</option>
                  <option value="suspicious">Suspicious Activity</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Description <span style={{ color: 'var(--text-muted)' }}>(optional)</span></label>
                <textarea
                  className="form-textarea"
                  placeholder="Provide details about the incident..."
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  style={{ minHeight: 90 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <div className="form-input" style={{ cursor: 'not-allowed', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span style={{ flex: 1 }}>
                    {locationStatus === 'detecting' && 'Detecting location...'}
                    {locationStatus === 'fallback' && location && `Using map center — Lat ${location.lat.toFixed(4)}, Lng ${location.lng.toFixed(4)}`}
                    {locationStatus === 'ready' && location && `Lat ${location.lat.toFixed(4)}, Lng ${location.lng.toFixed(4)}`}
                    {locationStatus === 'failed' && 'Location unavailable — report will work without it.'}
                    {locationStatus === 'unsupported' && 'Geolocation not supported in this browser.'}
                  </span>
                </div>
              </div>

              <label className="form-checkbox-row">
                <input
                  type="checkbox"
                  className="form-checkbox"
                  checked={anon}
                  onChange={e => setAnon(e.target.checked)}
                />
                Keep me anonymous (recommended)
              </label>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-teal" disabled={!type || submitted}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {submitted ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
