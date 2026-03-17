import { useEffect, useState } from 'react';
import { setAddToast } from '../utils/toast';
import './ToastSystem.css';

export function ToastSystem() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    setAddToast((opts) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, ...opts }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    });

    // Clean up on unmount
    return () => setAddToast(() => {});
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
