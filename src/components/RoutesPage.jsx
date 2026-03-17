import { useEffect, useState } from 'react';
import RouteCard from './RouteCard';
import { addToast } from '../utils/toast';
import { subscribeToScores } from '../services/firestore';
import './RoutesPage.css';

const DEFAULT_ROUTES = [
  {
    id: 1,
    name: 'North Ave',
    distance: 5.2, eta: 14, score: 92, incidents: 0,
    tags: ['Well-lit', 'CCTV', 'Low Traffic', 'Police Patrol'],
    destination: { lat: 40.7181, lng: -74.0022 },
  },
  {
    id: 2,
    name: 'Eastbrook Path',
    distance: 3.9, eta: 10, score: 81, incidents: 0,
    tags: ['Bike Lane', 'Scenic', 'Well-lit'],
    destination: { lat: 40.7127, lng: -74.0093 },
  },
  {
    id: 3,
    name: 'Downtown Loop',
    distance: 4.8, eta: 12, score: 68, incidents: 2,
    tags: ['Moderate Traffic', 'Police Patrol'],
    destination: { lat: 40.7105, lng: -74.0080 },
  },
  {
    id: 4,
    name: 'West Trail',
    distance: 6.1, eta: 18, score: 32, incidents: 4,
    tags: ['Poor Lighting', 'High Incidents', 'AVOID'],
    destination: { lat: 40.7063, lng: -74.0151 },
  },
];

const FILTERS = ['All Routes', 'Safe (75+)', 'Moderate', 'Caution'];

export default function RoutesPage({ onStartNavigation }) {
  const [routes, setRoutes] = useState(DEFAULT_ROUTES);
  const [selectedId, setSelectedId] = useState(1);
  const [filter, setFilter] = useState('All Routes');
  const [sort, setSort] = useState('score');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

  useEffect(() => {
    const unsubscribe = subscribeToScores((scores) => {
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

    return () => unsubscribe();
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
          {[
            { label: 'Routes Found', value: filtered.length, color: null },
            { label: 'Best Score', value: 92, color: 'var(--safe)' },
            { label: 'Fastest ETA', value: <>10 <small>min</small></>, color: null },
            { label: 'Active Incidents', value: 6, color: 'var(--moderate)' },
          ].map((s, i) => (
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
        <MapPanel selected={selected} />
      </div>
    </div>
  );
}

/* ---------- Map Panel ---------- */
function getSafetyColor(score) {
  if (score >= 75) return 'var(--safe)';
  if (score >= 50) return 'var(--moderate)';
  return 'var(--danger)';
}

function MapPanel({ selected }) {
  const color = selected ? getSafetyColor(selected.score) : 'var(--safe)';

  // Incident pins positions
  const incidentPins = [
    { cx: 380, cy: 240, label: 'Aggressive behavior' },
    { cx: 420, cy: 310, label: 'Poor lighting' },
    { cx: 350, cy: 280, label: 'Suspicious activity' },
  ];

  return (
    <div className="map-panel">
      {/* Map Header */}
      <div className="map-bar">
        <span className="map-bar-title">Route Preview</span>
        <div className="map-bar-right">
          <div className="location-alert-chip">
            <span>📍</span>
            <span>Entering <strong>{selected?.name || 'Route'}</strong> — {selected ? (selected.score >= 75 ? '🟢 Safe' : selected.score >= 50 ? '🟡 Moderate' : '🔴 Caution') : ''}</span>
          </div>
        </div>
      </div>

      {/* SVG Map */}
      <div className="map-canvas">
        <svg width="100%" height="100%" viewBox="0 0 700 480" preserveAspectRatio="xMidYMid slice">
          {/* BG */}
          <rect width="700" height="480" fill="#0f172a"/>
          {/* Grid */}
          {[...Array(9)].map((_,i) => <line key={`h${i}`} x1="0" y1={i*60} x2="700" y2={i*60} stroke="#1e293b" strokeWidth="1"/>)}
          {[...Array(10)].map((_,i) => <line key={`v${i}`} x1={i*78} y1="0" x2={i*78} y2="480" stroke="#1e293b" strokeWidth="1"/>)}

          {/* City blocks */}
          {[[40,40,90,70],[200,40,100,65],[360,50,85,60],[510,35,100,70],
            [40,140,80,60],[175,150,110,55],[330,140,95,60],[490,145,90,55],
            [40,270,90,65],[185,260,100,60],[350,260,80,65],[490,265,95,60],
            [40,380,100,70],[200,375,90,70],[360,375,95,65],[510,375,100,70],
            [140,200,60,40],[310,195,55,45],[445,195,65,40]].map(([x,y,w,h],i) => (
            <rect key={i} x={x} y={y} width={w} height={h} rx="3" fill="#1e293b" stroke="#263348" strokeWidth="1"/>
          ))}

          {/* Main roads */}
          <path d="M0 230 Q175 200 350 240 Q500 270 700 220" stroke="#263348" strokeWidth="20" fill="none"/>
          <path d="M350 0 Q360 120 380 240 Q395 340 390 480" stroke="#263348" strokeWidth="16" fill="none"/>
          <path d="M0 370 Q200 350 380 380 Q520 400 700 360" stroke="#263348" strokeWidth="12" fill="none"/>

          {/* Selected Route (highlighted) */}
          <path
            d="M90 230 Q220 190 350 240 Q480 285 610 225"
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 10px ${color})` }}
          />

          {/* Incident pins (West Trail / red routes) */}
          {selected && selected.incidents > 0 && incidentPins.slice(0, selected.incidents > 2 ? 3 : selected.incidents).map((pin, i) => (
            <g key={i}>
              <circle cx={pin.cx} cy={pin.cy} r="8" fill="#ef4444" opacity="0.9"/>
              <circle cx={pin.cx} cy={pin.cy} r="5" fill="#0f172a"/>
              <circle cx={pin.cx} cy={pin.cy} r="3" fill="#ef4444"/>
              <circle cx={pin.cx} cy={pin.cy} r="14" stroke="#ef4444" strokeWidth="1.5" fill="none" opacity="0.3">
                <animate attributeName="r" values="8;16;8" dur="2.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.4;0;0.4" dur="2.5s" repeatCount="indefinite"/>
              </circle>
            </g>
          ))}

          {/* Start pin (Blue) */}
          <g>
            <circle cx="90" cy="230" r="12" fill="#3b82f6" opacity="0.9"/>
            <circle cx="90" cy="230" r="7" fill="#0f172a"/>
            <circle cx="90" cy="230" r="4" fill="#3b82f6"/>
            <circle cx="90" cy="230" r="20" stroke="#3b82f6" strokeWidth="1.5" fill="none" opacity="0.3">
              <animate attributeName="r" values="12;22;12" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite"/>
            </circle>
          </g>

          {/* End pin (color of route) */}
          <g>
            <circle cx="610" cy="225" r="12" fill={color} opacity="0.9"/>
            <circle cx="610" cy="225" r="7" fill="#0f172a"/>
            <circle cx="610" cy="225" r="4" fill={color}/>
          </g>

          {/* Destination label */}
          <rect x="620" y="205" width="65" height="22" rx="4" fill="rgba(0,0,0,0.7)"/>
          <text x="627" y="220" fill={color} fontSize="10" fontWeight="700" fontFamily="Inter, sans-serif">
            DESTINATION
          </text>

          {/* Live Traffic badge */}
          <rect x="8" y="452" width="90" height="22" rx="4" fill="rgba(0,0,0,0.75)"/>
          <text x="14" y="467" fill="#06b6d4" fontSize="10" fontWeight="700" fontFamily="Inter, sans-serif">● LIVE TRAFFIC</text>
        </svg>

        {/* Incident tooltip (floating) */}
        {selected && selected.incidents > 0 && (
          <div className="incident-tooltip">
            <span className="incident-tooltip-icon">🚨</span>
            <div>
              <div className="incident-tooltip-title">{selected.incidents} incidents on this route</div>
              <div className="incident-tooltip-sub">in the last 2 hours</div>
            </div>
          </div>
        )}
      </div>

      {/* Route Detail */}
      {selected && <RouteDetailPanel route={selected} />}
    </div>
  );
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
