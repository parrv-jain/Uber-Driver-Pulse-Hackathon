// ── Btn ──────────────────────────────────────────────
export function Btn({ children, variant = 'primary', size = 'md', onClick, disabled, style }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'var(--font-body)', fontWeight: 600,
    borderRadius: 'var(--r-sm)', transition: 'all 0.15s',
    opacity: disabled ? 0.45 : 1,
    outline: 'none',
    ...size === 'sm' ? { padding: '6px 12px', fontSize: 12 } : { padding: '9px 18px', fontSize: 13 },
    ...style,
  };
  const variants = {
    primary:  { background: 'var(--lime)',    color: '#0a0a0a' },
    outline:  { background: 'transparent',   color: 'var(--text)',   border: '1px solid var(--border-hi)' },
    danger:   { background: 'var(--rose)',    color: '#fff' },
    success:  { background: 'var(--emerald)', color: '#0a0a0a' },
    ghost:    { background: 'var(--card)',    color: 'var(--text-2)', border: '1px solid var(--border)' },
    cyan:     { background: 'var(--cyan)',    color: '#0a0a0a' },
  };
  return (
    <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = 'brightness(1.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.filter = ''; }}>
      {children}
    </button>
  );
}

// ── Card ─────────────────────────────────────────────
export function Card({ children, accent, style }) {
  const colors = { lime: 'var(--lime)', cyan: 'var(--cyan)', coral: 'var(--coral)', emerald: 'var(--emerald)', rose: 'var(--rose)' };
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: '20px 22px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
      ...style,
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-hi)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {accent && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background: colors[accent] || accent, borderRadius:'99px 99px 0 0' }} />}
      {children}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────
export function StatCard({ label, value, sub, accent, children }) {
  return (
    <Card accent={accent}>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'2px', textTransform:'uppercase', color:'var(--text-3)', marginBottom:8 }}>{label}</div>
      <div style={{ fontSize:30, fontWeight:700, letterSpacing:'-1.5px', lineHeight:1, color:'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:'var(--text-2)', marginTop:6 }}>{sub}</div>}
      {children}
    </Card>
  );
}

// ── Badge ─────────────────────────────────────────────
export function Badge({ children, color = 'gray' }) {
  const map = {
    green:  { bg:'var(--emerald-dim)', color:'var(--emerald)', border:'rgba(53,241,126,0.2)' },
    yellow: { bg:'var(--lime-dim)',    color:'var(--lime)',    border:'rgba(200,241,53,0.2)' },
    red:    { bg:'var(--rose-dim)',    color:'var(--rose)',    border:'rgba(241,53,96,0.2)' },
    blue:   { bg:'var(--cyan-dim)',    color:'var(--cyan)',    border:'rgba(53,212,241,0.2)' },
    orange: { bg:'var(--coral-dim)',   color:'var(--coral)',   border:'rgba(241,96,53,0.2)' },
    gray:   { bg:'rgba(255,255,255,0.05)', color:'var(--text-2)', border:'var(--border)' },
  };
  const s = map[color] || map.gray;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding:'2px 8px', borderRadius:99,
      fontFamily:'var(--font-mono)', fontSize:10, fontWeight:700,
      letterSpacing:'0.5px', textTransform:'uppercase',
      background:s.bg, color:s.color, border:`1px solid ${s.border}`,
    }}>{children}</span>
  );
}

// ── Input ─────────────────────────────────────────────
export function Input({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div style={{ marginBottom:14 }}>
      {label && <label style={{ display:'block', fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'2px', textTransform:'uppercase', color:'var(--text-3)', marginBottom:6 }}>{label}</label>}
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{
          width:'100%', background:'var(--bg)', border:'1px solid var(--border)',
          borderRadius:'var(--r-sm)', padding:'9px 13px', color:'var(--text)',
          fontFamily:'var(--font-body)', fontSize:14, outline:'none', transition:'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--lime)'}
        onBlur={e => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────
export function Modal({ open, children }) {
  if (!open) return null;
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)',
      zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }}>
      <div style={{
        background:'var(--surface)', border:'1px solid var(--border-hi)', borderRadius:20,
        padding:28, width:'100%', maxWidth:440,
        animation:'popIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {children}
      </div>
      <style>{`@keyframes popIn { from { transform:scale(0.92); opacity:0 } to { transform:scale(1); opacity:1 } }`}</style>
    </div>
  );
}

// ── ProgressBar ───────────────────────────────────────
export function ProgressBar({ pct, color = 'var(--lime)' }) {
  return (
    <div style={{ height:5, background:'var(--bg)', borderRadius:99, overflow:'hidden', marginTop:10 }}>
      <div style={{ height:'100%', width:`${Math.min(100,pct)}%`, background:color, borderRadius:99, transition:'width 0.6s ease' }} />
    </div>
  );
}

// ── Mono label ────────────────────────────────────────
export function MonoLabel({ children, style }) {
  return <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-3)', ...style }}>{children}</span>;
}

// ── Spinner ───────────────────────────────────────────
export function Spinner({ size = 16 }) {
  return (
    <span style={{
      display:'inline-block', width:size, height:size,
      border:'2px solid var(--border-hi)', borderTopColor:'var(--lime)',
      borderRadius:'50%', animation:'spin 0.7s linear infinite', flexShrink:0,
    }}>
      <style>{`@keyframes spin { to { transform:rotate(360deg) } }`}</style>
    </span>
  );
}

// ── Empty ─────────────────────────────────────────────
export function Empty({ icon, title, sub }) {
  return (
    <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-3)' }}>
      <div style={{ fontSize:36, marginBottom:12, opacity:0.4 }}>{icon}</div>
      <div style={{ fontSize:15, fontWeight:600, color:'var(--text-2)', marginBottom:6 }}>{title}</div>
      {sub && <div style={{ fontSize:13 }}>{sub}</div>}
    </div>
  );
}

// ── Section Header ────────────────────────────────────
export function SectionHeader({ title, right }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
      <div style={{ fontSize:17, fontWeight:700, letterSpacing:'-0.3px' }}>{title}</div>
      {right && <div style={{ display:'flex', gap:8, alignItems:'center' }}>{right}</div>}
    </div>
  );
}

// ── Table ─────────────────────────────────────────────
export function Table({ head, rows }) {
  return (
    <div style={{ overflowX:'auto', borderRadius:'var(--r)', border:'1px solid var(--border)' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead>
          <tr>
            {head.map((h,i) => (
              <th key={i} style={{ background:'var(--bg)', padding:'10px 14px', textAlign:'left', fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'2px', textTransform:'uppercase', color:'var(--text-3)', borderBottom:'1px solid var(--border)', fontWeight:500 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row,i) => (
            <tr key={i} onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
              {row.map((cell,j) => (
                <td key={j} style={{ padding:'11px 14px', borderBottom: i < rows.length-1 ? '1px solid var(--border)' : 'none', verticalAlign:'middle' }}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
