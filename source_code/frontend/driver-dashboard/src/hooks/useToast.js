import { createContext, useContext, useState, useCallback } from 'react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div style={{
        position: 'fixed', top: 20, right: 20, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none'
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: 'var(--card)',
            border: `1px solid var(--border-hi)`,
            borderLeft: `3px solid ${t.type === 'success' ? 'var(--emerald)' : t.type === 'error' ? 'var(--rose)' : 'var(--cyan)'}`,
            borderRadius: 'var(--r)',
            padding: '11px 16px',
            fontSize: 13,
            maxWidth: 320,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            display: 'flex', gap: 10, alignItems: 'center',
            animation: 'slideIn 0.25s ease',
            pointerEvents: 'all',
            color: 'var(--text)',
            fontFamily: 'var(--font-body)',
          }}>
            <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'i'}</span>
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(110%); opacity:0 } to { transform:translateX(0); opacity:1 } }`}</style>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
