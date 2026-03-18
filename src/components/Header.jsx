import { useEffect, useRef, useState } from 'react';
import './Header.css';
import { loadGoogleMaps } from '../services/googleMaps';

// When the Maps JS API doesn't expose AutocompleteService (rare),
// we simply disable suggestions rather than attempting a blocked REST call.
// This avoids CORS errors from calling the Places REST API directly from the browser.
function noOpPredictions() {
  return Promise.resolve({ predictions: [], error: 'Autocomplete unavailable' });
}

export default function Header({ activeTab, notifCount, onBellClick, onProfileClick, onSearch }) {
  const pageTitle = {
    routes: 'Recommended Routes',
    map: 'Live Map',
    alerts: 'Safety Alerts',
    buddy: 'Buddy Mode',
    history: 'History',
  };

  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [predictionsError, setPredictionsError] = useState(null);
  const [useAutocompleteService, setUseAutocompleteService] = useState(false);
  const containerRef = useRef(null);
  const serviceRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    loadGoogleMaps()
      .then(() => {
        if (!mounted) return;

        if (window.google?.maps?.places?.AutocompleteService) {
          serviceRef.current = new window.google.maps.places.AutocompleteService();
          setUseAutocompleteService(true);
        } else {
          setUseAutocompleteService(false);
        }
      })
      .catch((err) => {
        console.warn('Failed to load Google Maps for autocomplete', err);
        setUseAutocompleteService(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const queryText = query.trim();
    if (!queryText) {
      setPredictions([]);
      setPredictionsError(null);
      setLoadingPredictions(false);
      return;
    }

    let cancelled = false;
    setLoadingPredictions(true);
    setPredictionsError(null);

    const updatePredictions = (items) => {
      if (cancelled) return;
      setPredictions(items || []);
      setActiveIndex(-1);
      setLoadingPredictions(false);
    };

    const updateError = (message) => {
      if (cancelled) return;
      setPredictions([]);
      setPredictionsError(message);
      setLoadingPredictions(false);
    };

    const fetchPreds = async () => {
      if (!useAutocompleteService) {
        const { predictions: preds, error } = await noOpPredictions();
        if (error) {
          updateError(error);
          return;
        }
        updatePredictions(preds);
        return;
      }

      serviceRef.current.getPlacePredictions({ input: queryText }, (preds, status) => {
        if (cancelled) return;
        if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
          updateError('No results found');
          return;
        }
        updatePredictions(preds || []);
      });
    };

    const timeout = setTimeout(fetchPreds, 170);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, useAutocompleteService]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const handleSelect = (text) => {
    setQuery(text);
    setShowSuggestions(false);
    setPredictions([]);
    if (onSearch) onSearch(text);
  };

  const handleInputChange = (event) => {
    setQuery(event.target.value);
    setShowSuggestions(true);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      setActiveIndex((prev) => Math.min(prev + 1, predictions.length - 1));
      return;
    }
    if (event.key === 'ArrowUp') {
      setActiveIndex((prev) => Math.max(prev - 1, 0));
      return;
    }
    if (event.key === 'Enter') {
      if (activeIndex >= 0 && predictions[activeIndex]) {
        handleSelect(predictions[activeIndex].description);
      } else if (query.trim() && onSearch) {
        onSearch(query.trim());
        setShowSuggestions(false);
      }
    }
    if (event.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <header className="header">
      {/* Breadcrumb + Title */}
      <div className="header-left">
        <div className="header-breadcrumb desktop-only">
          <span className="bc-root">SafeRoute</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          <span className="bc-page">{pageTitle[activeTab] || 'Dashboard'}</span>
        </div>
        <h1 className="header-title">{pageTitle[activeTab] || 'Dashboard'}</h1>
      </div>

      {/* Search */}
      <div className="header-search desktop-only" ref={containerRef}>
        <div className="search-wrap">
          <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            className="search-input"
            type="text"
            placeholder="Search destinations in your city..."
            id="destination-search"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
          />
          <kbd className="search-kbd">⌘K</kbd>

          {showSuggestions && (
            <div className="search-suggestions">
              {loadingPredictions ? (
                <div className="suggestion-item empty">Loading…</div>
              ) : predictionsError ? (
                <div className="suggestion-item empty">{predictionsError}</div>
              ) : predictions.length === 0 ? (
                <div className="suggestion-item empty">No results found</div>
              ) : (
                predictions.map((pred, idx) => (
                  <div
                    key={pred.place_id}
                    className={`suggestion-item ${idx === activeIndex ? 'active' : ''}`}
                    onMouseDown={() => handleSelect(pred.description)}
                  >
                    {pred.description}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="header-actions">
        {/* Live Status */}
        <div className="live-chip">
          <span className="live-dot" />
          Live
        </div>

        {/* Notifications */}
        <button className="header-icon-btn" id="notifications-btn" onClick={onBellClick}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {notifCount > 0 && (
            <span className="icon-badge" style={{ animation: 'pulse 2s ease infinite' }}>{notifCount}</span>
          )}
        </button>

        {/* Avatar */}
        <button className="avatar-btn" id="profile-btn" onClick={onProfileClick}>
          <div className="avatar">G</div>
          <div className="avatar-online" />
        </button>
      </div>
    </header>
  );
}
