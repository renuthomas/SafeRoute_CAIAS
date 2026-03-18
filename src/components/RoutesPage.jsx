import { useEffect, useState } from 'react';
import RouteCard from './RouteCard';
import MapView from './MapView';
import { addToast } from '../utils/toast';
import { subscribeToRoutes, subscribeToScores } from '../services/firestore';
import './RoutesPage.css';

// Fallback routes (Bangalore-themed) if Firestore has no data.
const FALLBACK_ROUTES = [
  {
    id: 1,
    name: 'MG Road Loop',
    distance: 4.2,
    eta: 12,
    score: 88,
    incidents: 0,
    tags: ['Well-lit', 'Bike lane', 'CCTV'],
    destination: { lat: 12.9718, lng: 77.5946 },
  },
  {
    id: 2,
    name: 'Koramangala Trail',
    distance: 5.5,
    eta: 15,
    score: 76,
    incidents: 1,
    tags: ['Moderate traffic', 'Parks', 'Cafes'],
    destination: { lat: 12.9352, lng: 77.6245 },
  },
  {
    id: 3,
    name: 'Hebbal Circuit',
    distance: 6.7,
    eta: 18,
    score: 61,
    incidents: 2,
    tags: ['Heavy traffic', 'Construction areas'],
    destination: { lat: 13.0358, lng: 77.5970 },
  },
];

const FILTERS = ['All Routes', 'Safe (75+)', 'Moderate', 'Caution'];

export default function RoutesPage({ onStartNavigation }) {
  const [routes, setRoutes] = useState(FALLBACK_ROUTES);
  const [selectedId, setSelectedId] = useState(FALLBACK_ROUTES[0]?.id);
  const [filter, setFilter] = useState('All Routes');
  const [sort, setSort] = useState('score');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

  useEffect(() => {
    const unsubscribeRoutes = subscribeToRoutes((routesFromDb) => {
      if (!routesFromDb || routesFromDb.length === 0) return;
      setRoutes(routesFromDb);
      setSelectedId(routesFromDb[0]?.id);
    });

    const unsubscribeScores = subscribeToScores((scores) => {
      if (!scores || scores.length === 0) return;
      setRoutes((prev) => prev.map((route) => {
        const scoreDoc = scores.find((s) => s.routeId === route.id || String(s.routeId) === String(route.id) || String(s.id) === String(route.id));
        if (!scoreDoc) return route;
        return {
          ...route,
          score: typeof scoreDoc.value === 'number' ? scoreDoc.value : route.score,
          incidents: typeof scoreDoc.incidents === 'number' ? scoreDoc.incidents : route.incidents,
        };
      }));
    });

    return () => {
      unsubscribeRoutes();
      unsubscribeScores();
    };
  }, []);

  const filtered = routes.filter(r => {
    if (filter === 'Safe (75+)') return r.score >= 75;
    if (filter === 'Moderate') return r.score >= 50 && r.score < 75;
    if (filter === 'Caution') return r.score < 50;
    return true;
  }).sort((a, b) => {
    if (sort === 'score') return b.score - a.score;
    if (sort === 'eta') return a.eta - b.eta;
    if (sort === 'distance') return a.distance - b.distance;
    return 0;
  });

  const selected = routes.find(r => r.id === selectedId);

  return (
    <div className="routes-page">
      {/* Mobile View Toggle */}
      <div className="mobile-view-toggle mobile-only">
        <button 
          className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => setViewMode('list')}
        >
          📋 List
        </button>
        <button 
          className={`toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
          onClick={() => setViewMode('map')}
        >
          🗺️ Map
        </button>
      </div>

      {/* ===== Left Panel ===== */}
      <div className={`routes-left ${viewMode === 'list' ? '' : 'mobile-hidden'}`}>
        {/* Stats */}
        <div className="stats-grid">
          {(() => {
            const bestScore = routes.reduce((max, r) => Math.max(max, typeof r.score === 'number' ? r.score : 0), 0);
            const fastestEta = routes.reduce((min, r) => Math.min(min, typeof r.eta === 'number' ? r.eta : Infinity), Infinity);
            const activeIncidents = routes.reduce((sum, r) => sum + (typeof r.incidents === 'number' ? r.incidents : 0), 0);

            return [
              { label: 'Routes Found', value: filtered.length, color: null },
              { label: 'Best Score', value: bestScore, color: 'var(--safe)' },
              { label: 'Fastest ETA', value: fastestEta === Infinity ? '—' : <>{fastestEta} <small>min</small></>, color: null },
              { label: 'Active Incidents', value: activeIncidents, color: 'var(--moderate)' },
            ];
          })().map((s, i) => (
            <div key={i} className="stat-item">
              <span className="stat-val" style={s.color ? { color: s.color } : {}}>{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Filters + sort */}
        <div className="routes-controls">
          <div className="filter-group">
            {FILTERS.map(f => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <select
            className="sort-select"
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            <option value="score">Safety Score</option>
            <option value="eta">Fastest ETA</option>
            <option value="distance">Distance</option>
          </select>
        </div>

        {/* Route List */}
        <div className="routes-list">
          {filtered.length === 0 ? (
            <div className="routes-empty">
              <span style={{ fontSize: 32 }}>🔍</span>
              <span>No routes match this filter</span>
            </div>
          ) : filtered.map((r, i) => (
            <RouteCard
              key={r.id}
              route={r}
              index={i}
              isSelected={selectedId === r.id}
              onSelect={(id) => {
                setSelectedId(id);
                const route = routes.find(x => x.id === id);
                if (route) {
                  const info = route.score >= 75 ? 'looking great — well-lit and safe!' : route.score >= 50 ? 'has moderate safety conditions.' : 'has poor safety — consider an alternative.';
                  addToast({ type: route.score >= 75 ? 'success' : route.score >= 50 ? 'warning' : 'danger', title: `${route.name} selected`, message: `${route.name} is ${info}` });
                }
              }}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="routes-cta">
          <button
            className="btn btn-teal btn-full btn-lg"
            id="start-navigation-btn"
            onClick={() => {
              if (selected) {
                const routeInfo = {
                  name: selected.name,
                  destination: selected.destination,
                  travelMode: 'WALKING',
                };
                if (onStartNavigation) onStartNavigation(routeInfo);
                addToast({ type: 'success', title: 'Navigation started!', message: `Navigating via ${selected.name}. Stay safe! 💙` });
              }
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
            Start Navigation
          </button>
        </div>
      </div>

      {/* ===== Right Panel: Map ===== */}
      <div className={`routes-right ${viewMode === 'map' ? '' : 'mobile-hidden'}`}>
        <div className="routes-map">
          <MapView
            center={selected?.destination}
            route={selected ? { origin: selected.destination, destination: selected.destination, travelMode: 'WALKING' } : null}
            markerLocation={selected?.destination}
            markerLabel={selected?.name}
          />
        </div>
      </div>
    </div>
  );
}

function getSafetyColor(score) {
  if (score >= 75) return 'var(--safe)';
  if (score >= 50) return 'var(--moderate)';
  return 'var(--danger)';
}

function RouteDetailPanel({ route }) {
  const color = getSafetyColor(route.score);
  const label = route.score >= 75 ? 'High Safety' : route.score >= 50 ? 'Moderate Safety' : 'Low Safety';

  return (
    <div className="route-detail">
      <div className="detail-top">
        <div>
          <div className="detail-name">{route.name}</div>
          <div className="detail-sub">{route.distance} mi · {route.eta} min ETA</div>
        </div>
        <div className="detail-score-col">
          <span className="detail-score-num" style={{ color }}>{route.score}</span>
          <span className="detail-score-denom">/100</span>
          <span className="detail-score-label" style={{ color }}>{label}</span>
        </div>
      </div>
      <div className="detail-stats-row">
        {[
          { k: 'Distance', v: `${route.distance} mi` },
          { k: 'ETA', v: `${route.eta} min` },
          { k: 'Incidents (2h)', v: route.incidents, danger: route.incidents > 0 },
          { k: 'Lighting', v: route.score >= 75 ? 'Good' : route.score >= 50 ? 'Moderate' : 'Poor', danger: route.score < 50 },
        ].map(s => (
          <div key={s.k} className="detail-stat">
            <span className="ds-key">{s.k}</span>
            <span className="ds-val" style={s.danger ? { color: 'var(--danger)' } : {}}>{s.v}</span>
          </div>
        ))}
      </div>
      <div className="detail-bar-wrap">
        <div className="detail-bar-track">
          <div className="detail-bar-fill" style={{ width: `${route.score}%`, background: color, boxShadow: `0 0 8px ${color}60` }} />
        </div>
        <span className="detail-bar-label" style={{ color }}>Safety Score</span>
      </div>
    </div>
  );
}
