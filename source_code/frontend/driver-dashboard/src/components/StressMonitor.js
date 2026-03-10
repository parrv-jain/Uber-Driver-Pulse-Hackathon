import { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { Card, Badge, SectionHeader, Btn, Empty, Spinner, Table, MonoLabel } from './UI';
import { apiGet, apiPost } from '../api';
import { useToast } from '../hooks/useToast';
import EarningVelocityMonitor from './EarningVelocityMonitor';

function levelColor(l) {
  if (!l) return 'gray';
  const s = l.toUpperCase();
  if (s === 'LOW')      return 'green';
  if (s === 'MEDIUM')   return 'yellow';
  if (s === 'HIGH')     return 'red';
  if (s === 'CRITICAL') return 'red';
  return 'gray';
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'var(--card)', border:'1px solid var(--border-hi)', borderRadius:8, padding:'10px 14px', fontSize:12, fontFamily:'var(--font-mono)' }}>
      <div style={{ color:'var(--text-3)', marginBottom:6 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ color:p.color, marginBottom:2 }}>{p.name}: {p.value?.toFixed(1)}</div>
      ))}
    </div>
  );
};

export default function StressMonitor({ activeRideId }) {
  const toast = useToast();
  const [snaps, setSnaps]       = useState([]);
  const [loading, setLoading]   = useState(false);
  const [strategy, setStrategy] = useState('AVERAGE');

  const load = useCallback(async () => {
    if (!activeRideId) return;
    try {
      const data = await apiGet('/rides/' + activeRideId + '/stress');
      setSnaps(data.snapshots || []);
    } catch {}
  }, [activeRideId]);

  // Auto-refresh every 5s when there's an active ride
  useEffect(() => {
    if (!activeRideId) return;
    setLoading(true);
    load().finally(() => setLoading(false));
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [activeRideId, load]);

  async function switchStrategy(name) {
    if (!activeRideId) { toast('No active ride', 'info'); return; }
    try {
      await apiPost('/rides/' + activeRideId + '/strategy', { strategy: name });
      setStrategy(name);
      toast('Strategy → ' + name, 'info');
    } catch(e) {
      toast(e.message, 'error');
    }
  }

  const chartData = snaps.map((s, i) => ({
    time: s.timestamp?.slice(0, 5) || `T${i}`,
    Audio:    +(s.audioScore    || 0).toFixed(1),
    Motion:   +(s.motionScore   || 0).toFixed(1),
    Combined: +(s.combinedScore || 0).toFixed(1),
  }));

  const last = snaps[snaps.length - 1];

  return (
    <div>
      {/* ── Stress Monitor section ─────────────────────────────────────────── */}
      <SectionHeader title="Stress Monitor" right={
        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
          <MonoLabel>Strategy:</MonoLabel>
          {['AVERAGE','PEAK','WEIGHTED'].map(s => (
            <div key={s} onClick={() => switchStrategy(s)} style={{
              padding:'5px 12px', borderRadius:99, cursor:'pointer', fontSize:11, fontWeight:700,
              border:`1px solid ${strategy===s ? 'var(--lime)' : 'var(--border)'}`,
              background: strategy===s ? 'var(--lime)' : 'transparent',
              color: strategy===s ? '#0a0a0a' : 'var(--text-2)',
              transition:'all 0.12s',
            }}>{s[0] + s.slice(1).toLowerCase()}</div>
          ))}
        </div>
      } />

      {!activeRideId ? (
        <Empty icon="📡" title="No active ride" sub="Accept a ride to monitor stress data in real time" />
      ) : loading && snaps.length === 0 ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size={28} /></div>
      ) : (
        <>
          {/* Score cards */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:20 }}>
            {[
              { label:'Audio Stress',   val: last?.audioScore,    level: last?.audioLevel,    color:'var(--lime)' },
              { label:'Motion Stress',  val: last?.motionScore,   level: last?.motionLevel,   color:'var(--cyan)' },
              { label:'Combined Score', val: last?.combinedScore, level: last?.combinedLevel, color:'var(--coral)' },
            ].map(item => (
              <Card key={item.label}>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'2px', textTransform:'uppercase', color:'var(--text-3)', marginBottom:8 }}>{item.label}</div>
                <div style={{ fontSize:32, fontWeight:800, letterSpacing:'-1.5px', color: item.color, lineHeight:1 }}>
                  {item.val != null ? item.val.toFixed(1) : '—'}
                </div>
                <div style={{ marginTop:8 }}>
                  {item.level ? <Badge color={levelColor(item.level)}>{item.level}</Badge> : <Badge>—</Badge>}
                </div>
              </Card>
            ))}
          </div>

          {/* Chart */}
          {snaps.length > 0 && (
            <Card style={{ marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div style={{ fontSize:14, fontWeight:700 }}>Snapshot Timeline</div>
                <Btn variant="ghost" size="sm" onClick={load}>↻ Refresh</Btn>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top:5, right:5, left:-20, bottom:0 }}>
                  <defs>
                    {[['Audio','#c8f135'],['Motion','#35d4f1'],['Combined','#f16035']].map(([k,c]) => (
                      <linearGradient key={k} id={`g${k}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={c} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={c} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="time" tick={{ fill:'#55557a', fontSize:10, fontFamily:'var(--font-mono)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#55557a', fontSize:10, fontFamily:'var(--font-mono)' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Audio"    stroke="#c8f135" fill="url(#gAudio)"    strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="Motion"   stroke="#35d4f1" fill="url(#gMotion)"   strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="Combined" stroke="#f16035" fill="url(#gCombined)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
              <div style={{ display:'flex', gap:16, marginTop:10 }}>
                {[['Audio','#c8f135'],['Motion','#35d4f1'],['Combined','#f16035']].map(([k,c])=>(
                  <div key={k} style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text-2)', fontFamily:'var(--font-mono)' }}>
                    <div style={{ width:10, height:3, borderRadius:2, background:c }} />{k}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Snapshots table */}
          {snaps.length > 0 && (
            <Card>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>All Snapshots</div>
              <Table
                head={['Time','Audio','Level','Motion','Level','Combined','Level','Flags']}
                rows={snaps.map(s => [
                  <MonoLabel style={{fontSize:10}}>{s.timestamp}</MonoLabel>,
                  <span style={{color:'var(--lime)',fontFamily:'var(--font-mono)',fontWeight:700}}>{s.audioScore?.toFixed(2)}</span>,
                  <Badge color={levelColor(s.audioLevel)}>{s.audioLevel}</Badge>,
                  <span style={{color:'var(--cyan)',fontFamily:'var(--font-mono)',fontWeight:700}}>{s.motionScore?.toFixed(2)}</span>,
                  <Badge color={levelColor(s.motionLevel)}>{s.motionLevel}</Badge>,
                  <span style={{color:'var(--coral)',fontFamily:'var(--font-mono)',fontWeight:700}}>{s.combinedScore?.toFixed(1)}</span>,
                  <Badge color={levelColor(s.combinedLevel)}>{s.combinedLevel}</Badge>,
                  <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                    {s.audioFlagged  && <Badge color="orange">🔊 Audio</Badge>}
                    {s.motionFlagged && <Badge color="blue">📳 Motion</Badge>}
                    {!s.audioFlagged && !s.motionFlagged && <Badge color="green">Clean</Badge>}
                  </div>,
                ])}
              />
            </Card>
          )}
        </>
      )}

      {/* ── Earning Velocity Monitor — rendered directly below ─────────────── */}
      <EarningVelocityMonitor activeRideId={activeRideId} />
    </div>
  );
}