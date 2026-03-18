import { useEffect, useMemo, useState } from 'react';
import { subscribeToBuddySession, subscribeToBuddyLocations } from '../services/firestore';
import MapView from './MapView';
import { addToast } from '../utils/toast';

export default function BuddyTrackerPage({ token }) {
  const [session, setSession] = useState(null);
  const [locations, setLocations] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | missing

  useEffect(() => {
    if (!token) {
      setStatus('missing');
      return;
    }

    const unsubSession = subscribeToBuddySession(token, (data) => {
      setSession(data);
      if (!data) {
        setStatus('missing');
      }
    });

    const unsubLocations = subscribeToBuddyLocations(token, (items) => {
      setLocations(items || []);
      if (items && items.length > 0) {
        setStatus('ready');
      }
    });

    return () => {
      unsubSession();
      unsubLocations();
    };
  }, [token]);

  const lastLocation = useMemo(() => {
    if (!locations || locations.length === 0) return null;
    return locations[locations.length - 1];
  }, [locations]);

  const lastUpdateText = useMemo(() => {
    const ts = lastLocation?.timestamp?.toDate?.();
    if (!ts) return null;
    return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(ts);
  }, [lastLocation]);

  const isExpired = useMemo(() => {
    if (!session?.expiresAt) return false;
    const expires = new Date(session.expiresAt);
    return expires.getTime() && expires.getTime() < Date.now();
  }, [session]);

  const handleGoHome = () => {
    window.location.href = window.location.origin + window.location.pathname;
  };

  useEffect(() => {
    if (status === 'missing') {
      addToast({
        type: 'danger',
        title: 'Invalid share link',
        message: 'This buddy share session does not exist or has ended.',
      });
    }
  }, [status]);

  return (
    <div className="buddy-tracker-page" style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 14 }}>
        <div>
          <h2 style={{ margin: 0 }}>Buddy Share Tracker</h2>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)' }}>
            {session ? (
              <>
                Tracking <strong>{session.contactName || 'your buddy'}</strong> in real time.
                {session.active === false && ' (session ended)'}
                {session.active !== false && isExpired && ' (session expired)'}
              </>
            ) : (
              'Loading shared session…'
            )}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={handleGoHome}>
          Go Home
        </button>
      </div>

      {status === 'missing' && (
        <div className="info-box" style={{ marginBottom: 16 }}>
          <strong>Uh oh.</strong> We couldn't find a live sharing session for this link.
          <br /> Ask your friend to resend the link or start a new Buddy Share session.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
        <div className="info-box" style={{ padding: 14 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Session Token</div>
          <div style={{ marginTop: 6, fontFamily: 'monospace', fontSize: 12, wordBreak: 'break-all' }}>{token}</div>
          {session?.createdAt && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              Started at {session.createdAt.toDate ? session.createdAt.toDate().toLocaleString() : ''}
            </div>
          )}
          {lastUpdateText && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              Last seen: {lastUpdateText}
            </div>
          )}
        </div>

        <div style={{ height: 520, borderRadius: 18, overflow: 'hidden', border: '1px solid var(--border)' }}>
          <MapView
            center={lastLocation ? { lat: lastLocation.lat, lng: lastLocation.lng } : undefined}
            route={session?.route}
            buddyLocations={locations}
            buddyLabel={session?.contactName}
          />
        </div>
      </div>
    </div>
  );
}
