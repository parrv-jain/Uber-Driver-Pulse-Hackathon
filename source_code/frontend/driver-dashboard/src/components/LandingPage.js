import { useState, useEffect } from 'react';

// ── 🔐 CHANGE PASSWORDS HERE ─────────────────────────────────────
const ADMIN_PASSWORD  = 'admin123';   // ← change admin password here
const DRIVER_PASSWORD = 'driver123';  // ← change driver password here
// ─────────────────────────────────────────────────────────────────

function GridBg() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(200,241,53,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(200,241,53,0.04) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
      }} />
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(200,241,53,0.08) 0%, transparent 70%)',
        animation: 'float1 8s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '-10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(53,212,241,0.07) 0%, transparent 70%)',
        animation: 'float2 10s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(30px,20px)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-20px,30px)} }
      `}</style>
    </div>
  );
}

// ── Splash Screen ─────────────────────────────────────────────────
function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    const t2 = setTimeout(() => setPhase(2), 2200);
    const t3 = setTimeout(() => onDone(), 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#080808',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 100,
      opacity: phase === 2 ? 0 : 1,
      transition: 'opacity 0.7s ease',
    }}>
      <GridBg />
      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{
          width: 80, height: 80, background: '#c8f135', borderRadius: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 38, margin: '0 auto 24px',
          boxShadow: '0 0 60px rgba(200,241,53,0.3)',
          transition: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)',
        }}>🚕</div>
        <div style={{ fontSize: 48, fontWeight: 900, letterSpacing: '-2px', color: '#fff' }}>
          Driver<span style={{ color: '#c8f135' }}>OS</span>
        </div>
        <div style={{
          fontFamily: 'monospace', fontSize: 13, letterSpacing: '4px',
          color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginTop: 10,
          opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.5s ease',
        }}>Pulse Platform · v2.0</div>
        <div style={{
          width: 200, height: 2, background: 'rgba(255,255,255,0.1)',
          borderRadius: 99, margin: '32px auto 0', overflow: 'hidden',
          opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.3s ease',
        }}>
          <div style={{
            height: '100%', background: '#c8f135', borderRadius: 99,
            width: phase >= 1 ? '100%' : '0%', transition: 'width 1.2s ease',
          }} />
        </div>
      </div>
    </div>
  );
}

// ── Login Modal (shared for driver + admin) ───────────────────────
function LoginModal({ role, onSuccess, onCancel }) {
  const isAdmin   = role === 'admin';
  const accent    = isAdmin ? '#35d4f1' : '#c8f135';
  const accentDim = isAdmin ? 'rgba(53,212,241,0.15)' : 'rgba(200,241,53,0.15)';
  const accentBorder = isAdmin ? 'rgba(53,212,241,0.3)' : 'rgba(200,241,53,0.3)';

  const [name,     setName]     = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [shake,    setShake]    = useState(false);

  function submit() {
    const correctPassword = isAdmin ? ADMIN_PASSWORD : DRIVER_PASSWORD;

    // Admin only needs password
    if (isAdmin) {
      if (password === correctPassword) {
        onSuccess({ role: 'admin' });
      } else {
        triggerError('Incorrect admin password');
      }
      return;
    }

    // Driver needs name + password
    if (!name.trim()) { triggerError('Please enter your name'); return; }
    if (password !== correctPassword) { triggerError('Incorrect driver password'); return; }
    onSuccess({ role: 'driver', name: name.trim() });
  }

  function triggerError(msg) {
    setError(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
    setPassword('');
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)', zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#111', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 20, padding: '36px 40px', width: 380,
        animation: shake ? 'shake 0.4s ease' : 'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Icon */}
        <div style={{
          width: 52, height: 52, background: accentDim,
          border: `1px solid ${accentBorder}`, borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, margin: '0 auto 20px',
        }}>{isAdmin ? '🛡️' : '🚗'}</div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
            {isAdmin ? 'Admin Access' : 'Driver Login'}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>
            {isAdmin ? 'Enter your admin password to continue' : 'Enter your name and password to start your shift'}
          </div>
        </div>

        {/* Driver name field */}
        {!isAdmin && (
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontFamily: 'monospace', fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Your Name</label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="e.g. Rahul Verma"
              autoFocus
              style={{
                width: '100%', background: '#1a1a1a',
                border: `1px solid ${error && !name ? '#f15353' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 10, padding: '12px 16px',
                color: '#fff', fontSize: 14, outline: 'none',
                fontFamily: 'sans-serif', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = accent}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
        )}

        {/* Password field */}
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontFamily: 'monospace', fontSize: 10, letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="••••••••"
            autoFocus={isAdmin}
            style={{
              width: '100%', background: '#1a1a1a',
              border: `1px solid ${error ? '#f15353' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: 10, padding: '12px 16px',
              color: '#fff', fontSize: 15, outline: 'none',
              fontFamily: 'monospace', letterSpacing: '3px',
              boxSizing: 'border-box', transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = accent}
            onBlur={e => e.target.style.borderColor = error ? '#f15353' : 'rgba(255,255,255,0.1)'}
          />
        </div>

        {error && (
          <div style={{ fontSize: 12, color: '#f15353', marginBottom: 12, fontFamily: 'monospace' }}>
            ✕ {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600,
          }}>Cancel</button>
          <button onClick={submit} style={{
            flex: 1, padding: '11px', borderRadius: 10, cursor: 'pointer',
            background: accent, border: 'none',
            color: '#0a0a0a', fontSize: 13, fontWeight: 700,
          }}>Enter</button>
        </div>
      </div>
      <style>{`
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
        @keyframes popIn { from{transform:scale(0.9);opacity:0} to{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  );
}

// ── Role Selection Screen ─────────────────────────────────────────
function RoleSelection({ onSelectDriver, onSelectAdmin }) {
  const [hovered,       setHovered]       = useState(null);
  const [showLoginFor,  setShowLoginFor]  = useState(null); // 'driver' | 'admin'
  const [visible,       setVisible]       = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 100); }, []);

  function handleLoginSuccess({ role, name }) {
    setShowLoginFor(null);
    if (role === 'admin')  onSelectAdmin();
    if (role === 'driver') onSelectDriver(name);
  }

  const roles = [
    {
      id: 'driver', icon: '🚗', title: 'Driver', subtitle: 'Start your shift',
      desc: 'Accept rides, track earnings, monitor your stress levels in real-time.',
      accent: '#c8f135', accentDim: 'rgba(200,241,53,0.08)', accentBorder: 'rgba(200,241,53,0.25)',
      badge: 'DRIVER POV',
    },
    {
      id: 'admin', icon: '🛡️', title: 'Admin', subtitle: 'Uber Operations',
      desc: 'Monitor all rides, review flagged moments, and oversee platform activity.',
      accent: '#35d4f1', accentDim: 'rgba(53,212,241,0.08)', accentBorder: 'rgba(53,212,241,0.25)',
      badge: 'ADMIN POV',
    },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: '#080808',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, position: 'relative',
    }}>
      <GridBg />
      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 760,
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'all 0.7s cubic-bezier(0.22,1,0.36,1)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 99, padding: '8px 18px', marginBottom: 24,
          }}>
            <div style={{ width: 28, height: 28, background: '#c8f135', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🚕</div>
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.6)', letterSpacing: '2px' }}>DRIVEROS · PULSE V2</span>
          </div>
          <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: '-2.5px', color: '#fff', lineHeight: 1.1, marginBottom: 14 }}>
            Choose your<br /><span style={{ color: '#c8f135' }}>access level</span>
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', maxWidth: 400, margin: '0 auto' }}>
            Select how you want to access the DriverOS platform
          </div>
        </div>

        {/* Role Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {roles.map((role, i) => {
            const isHovered = hovered === role.id;
            return (
              <div key={role.id}
                onClick={() => setShowLoginFor(role.id)}
                onMouseEnter={() => setHovered(role.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: isHovered ? role.accentDim : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isHovered ? role.accentBorder : 'rgba(255,255,255,0.08)'}`,
                  borderRadius: 20, padding: '32px 28px',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden',
                  transform: isHovered ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
                  transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
                  opacity: visible ? 1 : 0, transitionDelay: `${0.1 + i * 0.1}s`,
                  boxShadow: isHovered ? `0 20px 60px ${role.accentDim}` : 'none',
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: role.accent, opacity: isHovered ? 1 : 0.3, transition: 'opacity 0.25s' }} />
                <div style={{ display: 'inline-block', fontFamily: 'monospace', fontSize: 9, letterSpacing: '3px', color: role.accent, background: role.accentDim, border: `1px solid ${role.accentBorder}`, borderRadius: 99, padding: '3px 10px', marginBottom: 20 }}>{role.badge}</div>
                <div style={{ width: 64, height: 64, background: role.accentDim, border: `1px solid ${role.accentBorder}`, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, marginBottom: 20, transform: isHovered ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.25s' }}>{role.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 6 }}>{role.title}</div>
                <div style={{ fontSize: 13, color: role.accent, fontFamily: 'monospace', marginBottom: 14 }}>{role.subtitle}</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{role.desc}</div>
                <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 8, color: role.accent, fontSize: 13, fontWeight: 700, fontFamily: 'monospace', opacity: isHovered ? 1 : 0.5, transition: 'opacity 0.25s' }}>
                  Enter as {role.title}
                  <span style={{ transform: isHovered ? 'translateX(4px)' : 'translateX(0)', transition: 'transform 0.25s', display: 'inline-block' }}>→</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Login Modal */}
      {showLoginFor && (
        <LoginModal
          role={showLoginFor}
          onSuccess={handleLoginSuccess}
          onCancel={() => setShowLoginFor(null)}
        />
      )}
    </div>
  );
}

export default RoleSelection;
export { SplashScreen };
