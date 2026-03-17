import { useState } from 'react';
import './AnalyticsPage.css';

const historyData = [
  { id: 1, route: 'North Ave', date: 'Today, 8:30 AM', score: 92, duration: '14 min', dist: '5.2 mi', safe: true },
  { id: 2, route: 'Eastbrook Path', date: 'Yesterday, 5:15 PM', score: 81, duration: '10 min', dist: '3.9 mi', safe: true },
  { id: 3, route: 'Downtown Loop', date: 'Mar 15, 12:00 PM', score: 68, duration: '12 min', dist: '4.8 mi', safe: false },
  { id: 4, route: 'North Ave', date: 'Mar 14, 9:00 AM', score: 89, duration: '13 min', dist: '5.2 mi', safe: true },
  { id: 5, route: 'West Trail', date: 'Mar 13, 7:45 PM', score: 45, duration: '20 min', dist: '6.1 mi', safe: false },
];

const PERIOD_DATA = {
  '7D': {
    stats: [
      { icon: '🛡️', label: 'Avg Safety Score', val: '74.3', color: 'var(--moderate)', change: '+5.2%' },
      { icon: '✅', label: 'Routes Completed', val: '12', color: 'var(--cyan)', change: '+3 this week' },
      { icon: '⚠️', label: 'Incidents Avoided', val: '8', color: 'var(--safe)', change: '−2 vs last week' },
      { icon: '⏱️', label: 'Time Saved', val: '47m', color: 'var(--purple)', change: '+12m this week' },
    ],
    chart: [42, 68, 55, 91, 77, 83, 64],
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    breakdown: [
      { name: 'North Ave', trips: 6, pct: 50, color: 'var(--safe)' },
      { name: 'Eastbrook Path', trips: 4, pct: 33, color: 'var(--cyan)' },
      { name: 'Downtown Loop', trips: 2, pct: 17, color: 'var(--moderate)' },
    ]
  },
  '30D': {
    stats: [
      { icon: '🛡️', label: 'Avg Safety Score', val: '78.1', color: 'var(--safe)', change: '+2.1% vs prev month' },
      { icon: '✅', label: 'Routes Completed', val: '54', color: 'var(--cyan)', change: '+12% vs prev month' },
      { icon: '⚠️', label: 'Incidents Avoided', val: '32', color: 'var(--safe)', change: '+5 vs prev month' },
      { icon: '⏱️', label: 'Time Saved', val: '3.4h', color: 'var(--purple)', change: '+22m vs prev month' },
    ],
    chart: [72, 75, 68, 82, 79, 74, 88, 81, 76, 83, 91, 85, 78, 72, 65, 78, 84, 82, 77, 73, 79, 81, 85, 88, 92, 86, 81, 77, 83, 85],
    labels: Array.from({length: 30}, (_, i) => `${i + 1}`),
    breakdown: [
      { name: 'North Ave', trips: 22, pct: 41, color: 'var(--safe)' },
      { name: 'Eastbrook Path', trips: 18, pct: 33, color: 'var(--cyan)' },
      { name: 'Downtown Loop', trips: 10, pct: 18, color: 'var(--moderate)' },
      { name: 'West Trail', trips: 4, pct: 8, color: 'var(--danger)' },
    ]
  },
  '3M': {
    stats: [
      { icon: '🛡️', label: 'Avg Safety Score', val: '76.8', color: 'var(--moderate)', change: '+1.4% vs prev quarter' },
      { icon: '✅', label: 'Routes Completed', val: '162', color: 'var(--cyan)', change: '+8% vs prev quarter' },
      { icon: '⚠️', label: 'Incidents Avoided', val: '98', color: 'var(--safe)', change: '+14 vs prev quarter' },
      { icon: '⏱️', label: 'Time Saved', val: '10.2h', color: 'var(--purple)', change: '+1.1h vs prev quarter' },
    ],
    chart: [74, 78, 81, 75, 72, 68, 79, 83, 85, 77, 81, 76],
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].slice(0, 12),
    breakdown: [
      { name: 'North Ave', trips: 68, pct: 42, color: 'var(--safe)' },
      { name: 'Eastbrook Path', trips: 45, pct: 28, color: 'var(--cyan)' },
      { name: 'Downtown Loop', trips: 35, pct: 21, color: 'var(--moderate)' },
      { name: 'West Trail', trips: 14, pct: 9, color: 'var(--danger)' },
    ]
  }
};

function getColor(s) { return s >= 75 ? 'var(--safe)' : s >= 50 ? 'var(--moderate)' : 'var(--danger)'; }

export default function AnalyticsPage() {
  const [activePeriod, setActivePeriod] = useState('7D');
  const data = PERIOD_DATA[activePeriod];
  const maxVal = Math.max(...data.chart);

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="ana-header">
        <div>
          <h2 className="ana-title">📊 History & Analytics</h2>
          <p className="ana-sub">Your safety trends and recent routes</p>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['7D', '30D', '3M'].map((p) => (
            <button
              key={p}
              className={`period-btn ${activePeriod === p ? 'active' : ''}`}
              onClick={() => setActivePeriod(p)}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="summary-grid">
        {data.stats.map((s, i) => (
          <div key={i} className="summary-card" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="sc-icon">{s.icon}</div>
            <div className="sc-body">
              <span className="sc-val" style={{ color: s.color }}>{s.val}</span>
              <span className="sc-label">{s.label}</span>
              <span className="sc-change">{s.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="ana-row">
        {/* Bar Chart */}
        <div className="chart-card">
          <div className="chart-title">Safety Score Trend ({activePeriod})</div>
          <div className="bar-chart" style={{ gap: activePeriod === '30D' ? '2px' : '8px' }}>
            {data.chart.map((v, i) => {
              const pct = (v / maxVal) * 100;
              const c = getColor(v);
              return (
                <div key={i} className="bar-col">
                  {activePeriod !== '30D' && <span className="bar-val" style={{ color: c }}>{v}</span>}
                  <div className="bar-track">
                    <div className="bar-fill" style={{ height: `${pct}%`, background: c, boxShadow: `0 0 6px ${c}50`, animationDelay: `${i * (activePeriod === '30D' ? 20 : 70)}ms` }} />
                  </div>
                  {(activePeriod !== '30D' || (i + 1) % 5 === 0) && <span className="bar-day">{data.labels[i]}</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown */}
        <div className="chart-card">
          <div className="chart-title">Route Usage Breakdown</div>
          {data.breakdown.map(r => (
            <div key={r.name} className="bd-item">
              <div className="bd-top">
                <span className="bd-name">{r.name}</span>
                <span className="bd-trips">{r.trips} trips</span>
              </div>
              <div className="bd-track">
                <div className="bd-fill" style={{ width: `${r.pct}%`, background: r.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="chart-card">
        <div className="chart-title">Recent Routes</div>
        {historyData.map((h, i) => {
          const c = getColor(h.score);
          return (
            <div key={h.id} className="history-row" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="hr-icon" style={{ background: `${c}18`, border: `1px solid ${c}40` }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              </div>
              <div className="hr-info">
                <span className="hr-name">{h.route}</span>
                <span className="hr-meta">{h.date} · {h.duration} · {h.dist}</span>
              </div>
              <div className="hr-score" style={{ color: c }}>{h.score}<small>/100</small></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
