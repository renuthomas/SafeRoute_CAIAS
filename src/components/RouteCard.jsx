import { useState } from 'react';
import './RouteCard.css';

function getSafetyInfo(score) {
  if (score >= 75) return { color: 'var(--safe)', badgeClass: 'badge-safe', label: 'SAFE', bgClass: 'card-safe' };
  if (score >= 50) return { color: 'var(--moderate)', badgeClass: 'badge-moderate', label: 'MODERATE', bgClass: 'card-moderate' };
  return { color: 'var(--danger)', badgeClass: 'badge-danger', label: 'CAUTION', bgClass: 'card-danger' };
}

export default function RouteCard({ route, isSelected, onSelect, index }) {
  const { color, badgeClass, label, bgClass } = getSafetyInfo(route.score);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`route-card ${bgClass} ${isSelected ? 'selected' : ''} ${hovered ? 'hovered' : ''}`}
      onClick={() => onSelect(route.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ animationDelay: `${index * 70}ms` }}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onSelect(route.id)}
    >
      {isSelected && <div className="card-selected-bar" style={{ background: color }} />}

      {/* Header row */}
      <div className="card-header-row">
        <div className="card-name-group">
          <h3 className="card-name">{route.name}</h3>
          <span className={`safety-badge ${badgeClass}`}>{label} · {route.score}</span>
        </div>
        {/* Mini score ring */}
        <div className="card-score-ring">
          <svg width="46" height="46" viewBox="0 0 46 46">
            <circle cx="23" cy="23" r="18" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
            <circle
              cx="23" cy="23" r="18" fill="none"
              stroke={color}
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 18}`}
              strokeDashoffset={`${2 * Math.PI * 18 * (1 - route.score / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 23 23)"
              style={{ filter: `drop-shadow(0 0 3px ${color})` }}
            />
          </svg>
          <span className="ring-number" style={{ color }}>{route.score}</span>
        </div>
      </div>

      {/* Meta */}
      <div className="card-meta">
        <span className="meta-chip">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {route.eta} min
        </span>
        <span className="meta-sep">·</span>
        <span className="meta-chip">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          {route.distance} mi
        </span>
        {route.incidents > 0 && (
          <>
            <span className="meta-sep">·</span>
            <span className="meta-chip incident">
              🚨 {route.incidents} incident{route.incidents !== 1 ? 's' : ''} (2h)
            </span>
          </>
        )}
      </div>

      {/* Safety bar */}
      <div className="safety-bar-wrap">
        <div className="safety-bar-track">
          <div
            className="safety-bar-fill"
            style={{ width: `${route.score}%`, background: color, boxShadow: `0 0 6px ${color}60` }}
          />
        </div>
      </div>

      {/* Tags */}
      <div className="card-tags">
        {route.tags.map(tag => {
          const isDanger = tag === 'AVOID' || tag === 'High Incidents' || tag === 'Poor Lighting';
          return (
            <span key={tag} className={`tag ${isDanger ? 'tag-danger' : ''}`}>{tag}</span>
          );
        })}
      </div>
    </div>
  );
}
