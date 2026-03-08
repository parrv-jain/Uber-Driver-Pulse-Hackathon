const NAV = [
  { id:'dashboard', icon:'▣', label:'Dashboard' },
  { id:'rides',     icon:'🗺', label:'Available Rides' },
  { id:'stress',    icon:'📊', label:'Stress Monitor' },
  { id:'report',    icon:'📋', label:'Report' },
];

export default function Sidebar({ active, onNav, driver }) {
  return (
    <aside style={{
      width: 230, flexShrink:0,
      background:'var(--surface)',
      borderRight:'1px solid var(--border)',
      display:'flex', flexDirection:'column',
      position:'sticky', top:0, height:'100vh',
      padding:'24px 0',
    }}>
      {/* Logo */}
      <div style={{ padding:'0 20px 24px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:36, height:36, background:'var(--lime)', borderRadius:10,
            display:'flex', alignItems:'center', justifyContent:'center', fontSize:18,
          }}>🚕</div>
          <div>
            <div style={{ fontSize:17, fontWeight:800, letterSpacing:'-0.5px' }}>DriverOS</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:9, color:'var(--text-3)', letterSpacing:'2px', textTransform:'uppercase' }}>Pulse v2</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'16px 10px' }}>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'3px', textTransform:'uppercase', color:'var(--text-3)', padding:'0 10px', marginBottom:8 }}>Navigation</div>
        {NAV.map(item => {
          const isActive = active === item.id;
          return (
            <div key={item.id}
              onClick={() => onNav(item.id)}
              style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'9px 12px', borderRadius:'var(--r-sm)',
                cursor:'pointer', marginBottom:2,
                background: isActive ? 'var(--lime)' : 'transparent',
                color: isActive ? '#0a0a0a' : 'var(--text-2)',
                fontWeight: isActive ? 700 : 500,
                fontSize:14,
                transition:'all 0.12s',
                border: isActive ? 'none' : '1px solid transparent',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background='var(--card)'; e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text)'; }}}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='transparent'; e.currentTarget.style.color='var(--text-2)'; }}}
            >
              <span style={{ width:18, textAlign:'center', fontSize:15 }}>{item.icon}</span>
              <span>{item.label}</span>
            </div>
          );
        })}
      </nav>

      {/* Driver badge */}
      <div style={{ padding:'16px 20px 0', borderTop:'1px solid var(--border)' }}>
        {driver ? (
          <div style={{ background:'var(--card)', border:'1px solid var(--border)', borderRadius:'var(--r)', padding:'12px 14px' }}>
            <div style={{ fontSize:13, fontWeight:700, marginBottom:3 }}>{driver.name}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-3)', display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--emerald)', display:'inline-block', animation:'pulse 2s infinite' }}></span>
              Active Shift
            </div>
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
          </div>
        ) : (
          <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-3)', textAlign:'center', padding:'8px 0' }}>No active driver</div>
        )}
      </div>
    </aside>
  );
}
