import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, LineChart, Line
} from 'recharts';

// ── helpers ───────────────────────────────────────────
function levelColor(l) {
  if (!l) return '#55557a';
  const s = l.toUpperCase();
  if (s === 'LOW')      return '#35f17e';
  if (s === 'MEDIUM')   return '#c8f135';
  if (s === 'HIGH')     return '#f16035';
  if (s === 'CRITICAL') return '#f13560';
  return '#55557a';
}

function stressLabel(score) {
  if (score == null || isNaN(score)) return { label:'—', color:'#55557a' };
  if (score < 30)  return { label:'Low',      color:'#35f17e' };
  if (score < 60)  return { label:'Medium',   color:'#c8f135' };
  if (score < 80)  return { label:'High',     color:'#f16035' };
  return              { label:'Critical',  color:'#f13560' };
}

function ratingColor(r) {
  if (!r || r === 'N/A') return '#55557a';
  const s = r.toUpperCase();
  if (s.includes('LOW'))    return '#35f17e';
  if (s.includes('MEDIUM')) return '#c8f135';
  if (s.includes('HIGH'))   return '#f13560';
  return '#55557a';
}

// safely coerce a value to a number, return 0 if not possible
function num(v) {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

// ── chart tooltip ─────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#13131f', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'10px 14px', fontSize:11, fontFamily:'JetBrains Mono, monospace' }}>
      <div style={{ color:'#55557a', marginBottom:6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom:2 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}
        </div>
      ))}
    </div>
  );
};

function SectionDivider({ title }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, margin:'28px 0 18px' }}>
      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, letterSpacing:'3px', textTransform:'uppercase', color:'#55557a', whiteSpace:'nowrap' }}>{title}</div>
      <div style={{ flex:1, height:1, background:'rgba(255,255,255,0.06)' }} />
    </div>
  );
}

function Pill({ label, value, color = '#c8f135' }) {
  return (
    <div style={{ background:'#0f0f1a', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'14px 18px', flex:1, minWidth:120 }}>
      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, letterSpacing:'2px', textTransform:'uppercase', color:'#55557a', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.8px', color }}>{value}</div>
    </div>
  );
}

function FlagCard({ snap, index }) {
  const types = [];
  if (snap.audioFlagged)  types.push({ icon:'🔊', label:'Audio spike',  color:'#f16035', score: num(snap.audioScore) });
  if (snap.motionFlagged) types.push({ icon:'📳', label:'Motion spike', color:'#35d4f1', score: num(snap.motionScore) });
  return (
    <div style={{ background:'#0f0f1a', border:'1px solid rgba(241,96,53,0.2)', borderLeft:'3px solid #f16035', borderRadius:10, padding:'14px 16px', display:'flex', alignItems:'center', gap:16 }}>
      <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:11, color:'#55557a', minWidth:28, textAlign:'center' }}>#{index + 1}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:6 }}>
          {types.map((t, i) => (
            <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:99, background:`${t.color}18`, border:`1px solid ${t.color}30`, fontFamily:'JetBrains Mono, monospace', fontSize:10, color:t.color }}>
              {t.icon} {t.label} — {t.score.toFixed(1)}
            </span>
          ))}
        </div>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'#55557a' }}>
          {snap.timestamp} · Combined: <span style={{ color: levelColor(snap.combinedLevel) }}>{num(snap.combinedScore).toFixed(1)} ({snap.combinedLevel || '—'})</span>
        </div>
      </div>
      <div style={{ textAlign:'right', flexShrink:0 }}>
        <div style={{ fontSize:18, fontWeight:800, color: levelColor(snap.combinedLevel) }}>{num(snap.combinedScore).toFixed(0)}</div>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, color:'#55557a' }}>stress</div>
      </div>
    </div>
  );
}

// ── No-data placeholder ───────────────────────────────
function NoData({ message }) {
  return (
    <div style={{ background:'#080810', border:'1px solid rgba(255,255,255,0.04)', borderRadius:12, padding:'30px', textAlign:'center', color:'#55557a', fontFamily:'JetBrains Mono, monospace', fontSize:12 }}>
      {message}
    </div>
  );
}

// ── Main export ───────────────────────────────────────
export default function TripSummary({ data, onClose }) {
  if (!data) return null;

  const { ride, snapshots = [], completionData = {}, velocityHistory = [] } = data;

  // ── Safely parse all snapshot scores ─────────────────
  const parsed = snapshots.map((s, i) => ({
    ...s,
    audioScore:    num(s.audioScore),
    motionScore:   num(s.motionScore),
    combinedScore: num(s.combinedScore),
    currentVelocity: num(s.currentVelocity),
    requiredVelocity: num(s.requiredVelocity),
    velocityDelta: num(s.velocityDelta),
    // use index as x-axis key to avoid duplicate timestamp collisions
    idx: `S${i + 1}`,
    // short time label: try to extract HH:MM:SS, fallback to index
    timeLabel: (() => {
      if (!s.timestamp) return `S${i+1}`;
      // timestamp may be "HH:MM:SS" or "HH:MM:SS.nnn" or full ISO
      const match = String(s.timestamp).match(/(\d{2}:\d{2})/);
      return match ? match[1] : `S${i+1}`;
    })(),
  }));

  const hasScores = parsed.some(s => s.audioScore > 0 || s.motionScore > 0 || s.combinedScore > 0);

  const flaggedSnaps = parsed.filter(s => s.audioFlagged || s.motionFlagged);
  const avgAudio     = completionData.rideAudioScore;
  const avgMotion    = completionData.rideMotionScore;
  const avgCombined  = completionData.rideStressScore;
  const peakCombined = parsed.length ? Math.max(...parsed.map(s => s.combinedScore)) : 0;
  const stressInfo   = completionData.stressRating;

  // ── Stress chart — use index as X so no duplicates ───
  const stressChartData = parsed.map(s => ({
    t:        s.timeLabel,
    Audio:    +s.audioScore.toFixed(1),
    Motion:   +s.motionScore.toFixed(1),
    Combined: +s.combinedScore.toFixed(1),
    flagged:  s.audioFlagged || s.motionFlagged,
  }));

  // ── Velocity chart ────────────────────────────────────
  const velChartData = parsed.map(s => ({
    t:        s.timeLabel,
    Current:    +s.currentVelocity.toFixed(1),
    Required:   +s.requiredVelocity.toFixed(1),
    Delta: +s.velocityDelta.toFixed(1),
  }));

  const fareEarned   = num(ride?.fare || completionData?.fare || 0);
  const stressRating = completionData?.stressRating || 'N/A';
  const audioFlags   = num(completionData?.audioFlags  || 0);
  const motionFlags  = num(completionData?.motionFlags || 0);

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', backdropFilter:'blur(8px)', zIndex:2000, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'24px 20px', overflowY:'auto' }}
    >
      <div style={{ background:'#0f0f1a', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, width:'100%', maxWidth:780, padding:'28px 32px', position:'relative', animation:'popIn 0.25s cubic-bezier(0.34,1.56,0.64,1)', marginBottom:24 }}>
        <style>{`@keyframes popIn{from{transform:scale(0.94) translateY(16px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}`}</style>

        {/* Close */}
        <button onClick={onClose} style={{ position:'absolute', top:20, right:20, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, width:32, height:32, cursor:'pointer', color:'#9999b8', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'inherit' }}>✕</button>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', gap:16, marginBottom:6 }}>
          <div style={{ width:44, height:44, background:'#c8f13520', border:'1px solid #c8f13540', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>🏁</div>
          <div>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, letterSpacing:'3px', textTransform:'uppercase', color:'#55557a', marginBottom:4 }}>Trip Summary</div>
            <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.8px' }}>
              {ride?.from} <span style={{ color:'#c8f135' }}>→</span> {ride?.to}
            </div>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'#55557a', marginTop:3 }}>
              {ride?.rideId} · {parsed.length} snapshots
            </div>
          </div>
        </div>

        {/* Overview */}
        <SectionDivider title="Overview" />
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <Pill label="Fare Earned"    value={`₹${fareEarned}`}            color="#c8f135" />
          <Pill label="Stress Rating"  value={stressRating}                color={ratingColor(stressRating)} />
          <Pill label="Avg Stress"     value={hasScores ? avgCombined.toFixed(2) : '—'}  color={stressInfo.color} />
          <Pill label="Peak Stress"    value={hasScores ? peakCombined.toFixed(2) : '—'} color={levelColor(stressLabel(peakCombined).label.toUpperCase())} />
          <Pill label="Audio Flags"    value={audioFlags}   color={audioFlags  > 0 ? '#f16035' : '#35f17e'} />
          <Pill label="Motion Flags"   value={motionFlags}  color={motionFlags > 0 ? '#35d4f1' : '#35f17e'} />
        </div>

        {/* Stress Breakdown bars */}
        <SectionDivider title="Stress Breakdown" />
        {!hasScores ? (
          <NoData message="Stress scores were not recorded for this trip" />
        ) : (
          <div style={{ display:'flex', gap:10 }}>
            {[
              { label:'Avg Audio',    val: avgAudio,    color:'#c8f135' },
              { label:'Avg Motion',   val: avgMotion,   color:'#35d4f1' },
              { label:'Avg Combined', val: avgCombined, color: stressInfo.color },
            ].map(item => (
              <div key={item.label} style={{ flex:1, background:'#080810', border:'1px solid rgba(255,255,255,0.06)', borderRadius:10, padding:'12px 16px' }}>
                <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, letterSpacing:'2px', textTransform:'uppercase', color:'#55557a', marginBottom:6 }}>{item.label}</div>
                <div style={{ fontSize:24, fontWeight:800, letterSpacing:'-0.8px', color:item.color }}>{item.val.toFixed(2)}</div>
                <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:99, marginTop:8, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${Math.min(100, item.val)}%`, background:item.color, borderRadius:99 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stress Timeline */}
        <SectionDivider title="Stress Timeline" />
        {!hasScores || stressChartData.length < 2 ? (
          <NoData message={parsed.length < 2 ? `Only ${parsed.length} snapshot(s) — need at least 2 to draw a chart` : 'All stress scores are zero — sensor data may not have been captured'} />
        ) : (
          <div style={{ background:'#080810', border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, padding:'16px 12px 8px' }}>
            {/* Debug row — shows raw values so you can confirm data is flowing */}
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, color:'#55557a', marginBottom:8, paddingLeft:4 }}>
              {parsed.length} pts · max audio {Math.max(...parsed.map(s=>s.audioScore)).toFixed(1)} · max motion {Math.max(...parsed.map(s=>s.motionScore)).toFixed(1)} · max combined {peakCombined.toFixed(1)}
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={stressChartData} margin={{ top:5, right:5, left:-10, bottom:0 }}>
                <defs>
                  {[['Audio','#c8f135'],['Motion','#35d4f1'],['Combined','#f16035']].map(([k,c]) => (
                    <linearGradient key={k} id={`ts${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={c} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={c} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="t" tick={{ fill:'#55557a', fontSize:9, fontFamily:'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis domain={[0, 2]} ticks={[0, 0.5, 1, 1.5, 2]} tick={{ fill:'#55557a', fontSize:9, fontFamily:'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                {stressChartData.filter(d => d.flagged).map((d, i) => (
                  <ReferenceLine key={i} x={d.t} stroke="rgba(241,96,53,0.5)" strokeDasharray="4 2" />
                ))}
                <Area type="monotone" dataKey="Audio"    stroke="#c8f135" fill="url(#tsAudio)"    strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="Motion"   stroke="#35d4f1" fill="url(#tsMotion)"   strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="Combined" stroke="#f16035" fill="url(#tsCombined)" strokeWidth={2.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', gap:16, marginTop:8, paddingLeft:4 }}>
              {[['Audio','#c8f135'],['Motion','#35d4f1'],['Combined','#f16035']].map(([k,c]) => (
                <div key={k} style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'#55557a', fontFamily:'JetBrains Mono, monospace' }}>
                  <div style={{ width:10, height:2, borderRadius:2, background:c }} />{k}
                </div>
              ))}
              {stressChartData.some(d => d.flagged) && (
                <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color:'#f16035', fontFamily:'JetBrains Mono, monospace', marginLeft:'auto' }}>
                  <div style={{ width:1, height:10, background:'rgba(241,96,53,0.6)' }} /> Flag event
                </div>
              )}
            </div>
          </div>
        )}

        {/* Flagged Moments */}
        <SectionDivider title={`Flagged Moments (${flaggedSnaps.length})`} />
        {flaggedSnaps.length === 0 ? (
          <div style={{ textAlign:'center', padding:'24px', background:'rgba(53,241,126,0.04)', borderRadius:12, border:'1px solid rgba(53,241,126,0.15)' }}>
            <div style={{ fontSize:24, marginBottom:8 }}>✅</div>
            <div style={{ fontWeight:700, color:'#35f17e', marginBottom:4 }}>No flagged events</div>
            <div style={{ fontSize:12, color:'#55557a' }}>Clean, low-stress ride</div>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {flaggedSnaps.map((s, i) => <FlagCard key={i} snap={s} index={i} />)}
          </div>
        )}

        {/* Cause Analysis */}
        {(parsed.some(s=>s.audioFlagged) || parsed.some(s=>s.motionFlagged)) && (
          <>
            <SectionDivider title="Cause Analysis" />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div style={{ background:'#080810', border:'1px solid rgba(200,241,53,0.12)', borderRadius:12, padding:'16px 18px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <span>🔊</span>
                  <div style={{ fontWeight:700, fontSize:14 }}>Audio Stress</div>
                </div>
                <div style={{ fontSize:13, color:'#9999b8', lineHeight:1.8 }}>
                  {parsed.filter(s=>s.audioFlagged).length > 0 ? <>
                    <div>• <span style={{color:'#c8f135'}}>{parsed.filter(s=>s.audioFlagged).length} spike(s)</span> detected</div>
                    <div>• Peak: <span style={{color:'#c8f135'}}>{Math.max(...parsed.map(s=>s.audioScore)).toFixed(1)}</span></div>
                    <div>• Average: <span style={{color:'#c8f135'}}>{avgAudio.toFixed(1)}</span></div>
                    <div style={{marginTop:8, fontSize:11, color:'#55557a'}}>Possible causes: loud passengers, honking, music</div>
                  </> : <div style={{color:'#35f17e'}}>No audio flags</div>}
                </div>
              </div>
              <div style={{ background:'#080810', border:'1px solid rgba(53,212,241,0.12)', borderRadius:12, padding:'16px 18px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                  <span>📳</span>
                  <div style={{ fontWeight:700, fontSize:14 }}>Motion Stress</div>
                </div>
                <div style={{ fontSize:13, color:'#9999b8', lineHeight:1.8 }}>
                  {parsed.filter(s=>s.motionFlagged).length > 0 ? <>
                    <div>• <span style={{color:'#35d4f1'}}>{parsed.filter(s=>s.motionFlagged).length} spike(s)</span> detected</div>
                    <div>• Peak: <span style={{color:'#35d4f1'}}>{Math.max(...parsed.map(s=>s.motionScore)).toFixed(1)}</span></div>
                    <div>• Average: <span style={{color:'#35d4f1'}}>{avgMotion.toFixed(1)}</span></div>
                    <div style={{marginTop:8, fontSize:11, color:'#55557a'}}>Possible causes: hard braking, potholes, sharp turns</div>
                  </> : <div style={{color:'#35f17e'}}>No motion flags</div>}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Verdict */}
        <SectionDivider title="Overall Verdict" />
        <div style={{ background: avgCombined < 0.30 ? 'rgba(53,241,126,0.05)' : avgCombined < 0.60 ? 'rgba(200,241,53,0.05)' : 'rgba(241,96,53,0.05)', border:`1px solid ${avgCombined < 0.30 ? 'rgba(53,241,126,0.2)' : avgCombined < 0.60 ? 'rgba(200,241,53,0.2)' : 'rgba(241,96,53,0.2)'}`, borderRadius:12, padding:'18px 22px', display:'flex', alignItems:'center', gap:20 }}>
          <div style={{ fontSize:36 }}>{avgCombined < 0.30 ? '😌' : avgCombined < 0.60 ? '🙂' : avgCombined < 0.85 ? '😐' : '😰'}</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:800, marginBottom:4, color: stressInfo.color }}>
              {avgCombined < 0.30 ? 'Relaxed Trip' : avgCombined < 0.60 ? 'Normal Trip' : avgCombined < 0.85 ? 'Stressful Trip' : 'High Stress Trip'}
            </div>
            <div style={{ fontSize:13, color:'#9999b8', lineHeight:1.6 }}>
              Avg stress: <strong style={{ color:stressInfo.color }}>{hasScores ? avgCombined.toFixed(2) : '—'}</strong> ·{' '}
              {flaggedSnaps.length === 0 ? 'No flagged events — excellent drive!' : `${flaggedSnaps.length} flagged event${flaggedSnaps.length > 1 ? 's' : ''} recorded`}
              
            </div>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, letterSpacing:'2px', color:'#55557a', marginBottom:4 }}>STRESS RATING</div>
            <div style={{ fontSize:18, fontWeight:800, color: ratingColor(stressRating) }}>{stressRating}</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop:24, display:'flex', justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ background:'#c8f135', color:'#0a0a0a', border:'none', borderRadius:8, padding:'10px 24px', fontFamily:'DM Sans, sans-serif', fontSize:14, fontWeight:700, cursor:'pointer' }}
            onMouseEnter={e=>e.target.style.background='#b5dc2a'}
            onMouseLeave={e=>e.target.style.background='#c8f135'}
          >Done</button>
        </div>
      </div>
    </div>
  );
}
