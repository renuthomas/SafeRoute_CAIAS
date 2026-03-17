import { useState, useCallback } from 'react';
import './ToastSystem.css';

let _addToast = null;
export function addToast(opts) { _addToast && _addToast(opts); }

export function ToastSystem() {
  const [toasts, setToasts] = useState([]);

  _addToast = useCallback((opts) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, ...opts }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4200);
  }, []);

  const dismiss = (id) => setToasts(p => p.filter(t => t.id !== id));

  const icons = { success: '✓', warning: '⚠️', danger: '🚨', info: 'ℹ️' };

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type || 'info'}`} onClick={() => dismiss(t.id)}>
          <span className="toast-icon">{icons[t.type] || icons.info}</span>
          <div className="toast-body">
            {t.title && <div className="toast-title">{t.title}</div>}
            <div className="toast-msg">{t.message}</div>
          </div>
          <button className="toast-close" onClick={e => { e.stopPropagation(); dismiss(t.id); }}>×</button>
          <div className="toast-progress" />
        </div>
      ))}
    </div>
  );
}
