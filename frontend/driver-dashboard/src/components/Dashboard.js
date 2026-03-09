import { StatCard, Badge, ProgressBar, Card, Btn, SectionHeader, Empty, Table, MonoLabel } from './UI';

function ratingColor(r) {
  if (!r || r === 'N/A') return 'gray';
  const s = r.toUpperCase();
  if (s.includes('LOW'))    return 'green';
  if (s.includes('MEDIUM')) return 'yellow';
  if (s.includes('HIGH'))   return 'red';
  return 'gray';
}

function paceColor(status) {
  if (!status) return 'gray';
  const s = status.toUpperCase();
  if (s.includes('AHEAD') || s.includes('FAST'))   return 'green';
  if (s.includes('ON'))                             return 'lime';
  if (s.includes('BEHIND') || s.includes('SLOW'))  return 'yellow';
  if (s.includes('CRITICAL') || s.includes('FAR')) return 'red';
  return 'gray';
}

// ── Velocity gauge bar ────────────────────────────────
function VelocityBar({ current, target: tgt }) {
  const max    = Math.max(current, tgt, 1);
  const curPct = (current / max) * 100;
  const tgtPct = (tgt     / max) * 100;
  const ahead  = current >= tgt;

  return (
    <div style={{ position:'relative', height:10, background:'var(--bg)', borderRadius:99, overflow:'visible', marginTop:6 }}>
      {/* target marker */}
      <div style={{
        position:'absolute', top:-3, left:`${tgtPct}%`,
        width:2, height:16, background:'var(--cyan)', borderRadius:2,
        transform:'translateX(-50%)', zIndex:2,
      }} />
      {/* current fill */}
      <div style={{
        height:'100%',
        width:`${curPct}%`,
        background: ahead
          ? 'linear-gradient(90deg, var(--emerald), var(--lime))'
          : 'linear-gradient(90deg, var(--coral), var(--rose))',
        borderRadius:99,
        transition:'width 0.8s ease',
        position:'relative', zIndex:1,
      }} />
    </div>
  );
}

// ── Velocity Card ─────────────────────────────────────
// Reads currentEarningVelocity, requiredEarningVelocity, paceStatus
// directly from the /driver/{id}/report response.
function VelocityCard({ report, activeRide }) {
  if (!report) return null;

  const cur    = report.currentEarningVelocity  ?? 0;
  const tgt    = report.requiredEarningVelocity ?? 0;
  const status = report.paceStatus ?? null;
  const ahead  = cur >= tgt;
  const diff   = Math.abs(cur - tgt).toFixed(2);
  const label  = tgt === 0
    ? 'Goal reached 🎉'
    : ahead ? `+₹${diff}/h ahead` : `-₹${diff}/h behind`;

  return (
    <div style={{
      background: 'var(--card)',
      border: `1px solid ${ahead ? 'rgba(53,241,126,0.2)' : 'rgba(241,96,53,0.2)'}`,
      borderRadius: 'var(--r-lg)',
      padding: '18px 22px',
      marginBottom: 22,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position:'absolute', top:0, right:0, width:200, height:'100%',
        background: ahead
          ? 'radial-gradient(ellipse at right, rgba(53,241,126,0.06), transparent 70%)'
          : 'radial-gradient(ellipse at right, rgba(241,96,53,0.06), transparent 70%)',
        pointerEvents:'none',
      }} />

      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
        <div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'3px', color:'var(--text-3)', textTransform:'uppercase', marginBottom:6 }}>
            Earning Velocity
            {activeRide && (
              <span style={{ marginLeft:8, color:'var(--lime)', background:'var(--lime-dim)', padding:'1px 6px', borderRadius:99, border:'1px solid var(--lime-glow)' }}>
                ● LIVE
              </span>
            )}
          </div>
          <div style={{ display:'flex', alignItems:'baseline', gap:16, flexWrap:'wrap' }}>
            {/* Current */}
            <div>
              <span style={{ fontSize:28, fontWeight:800, letterSpacing:'-1px', color: ahead ? 'var(--emerald)' : 'var(--coral)' }}>
                ₹{cur.toFixed(2)}
              </span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-3)', marginLeft:4 }}>/hr actual</span>
            </div>

            <div style={{ width:1, height:28, background:'var(--border)' }} />

            {/* Required */}
            <div>
              <span style={{ fontSize:28, fontWeight:800, letterSpacing:'-1px', color:'var(--cyan)' }}>
                ₹{tgt.toFixed(2)}
              </span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-3)', marginLeft:4 }}>/hr needed</span>
            </div>

            {/* Pace Status badge */}
            {status && (
              <>
                <div style={{ width:1, height:28, background:'var(--border)' }} />
                <div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'2px', color:'var(--text-3)', textTransform:'uppercase', marginBottom:4 }}>Pace</div>
                  <Badge color={paceColor(status)}>{status}</Badge>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Ahead/behind pill */}
        <div style={{
          padding:'6px 12px', borderRadius:99, fontSize:11, fontWeight:700,
          fontFamily:'var(--font-mono)',
          background: ahead ? 'var(--emerald-dim)' : 'var(--coral-dim)',
          color:      ahead ? 'var(--emerald)'     : 'var(--coral)',
          border:`1px solid ${ahead ? 'rgba(53,241,126,0.2)' : 'rgba(241,96,53,0.2)'}`,
          whiteSpace:'nowrap', alignSelf:'flex-start',
        }}>{label}</div>
      </div>

      {/* Gauge */}
      <VelocityBar current={cur} target={tgt} />

      {/* Legend */}
      <div style={{ display:'flex', gap:20, marginTop:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text-3)' }}>
          <div style={{ width:10, height:3, borderRadius:2, background:'var(--emerald)' }} />
          Current pace
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, fontFamily:'var(--font-mono)', color:'var(--text-3)' }}>
          <div style={{ width:2, height:10, borderRadius:2, background:'var(--cyan)' }} />
          Target pace
        </div>
        <div style={{ marginLeft:'auto', fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-3)' }}>
          Updates after each completed ride
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ driver, report, activeRide, onCompleteRide, onViewStress, onRefresh }) {
  const earned    = report?.currentEarned ?? 0;
  const target    = report?.targetAmount  ?? (driver?.earningGoal ?? 0);
  const pct       = target > 0 ? (earned / target) * 100 : 0;
  const rides     = report?.completedRides ?? [];
  const remaining = report?.remaining ?? target;
  const goalMet   = report?.goalMet   ?? false;
  // console.log(driver);
  return (
    <div>
      {/* Active Ride Banner */}
      {activeRide && (
        <div style={{
          background:'linear-gradient(135deg, #141424, #1a1a2e)',
          border:'1px solid var(--lime)',
          borderRadius:'var(--r-lg)',
          padding:'18px 22px',
          marginBottom:16,
          position:'relative',
          overflow:'hidden',
        }}>
          <div style={{
            position:'absolute', top:12, right:14,
            fontFamily:'var(--font-mono)', fontSize:9, letterSpacing:'3px',
            color:'var(--lime)', background:'var(--lime-dim)',
            padding:'3px 9px', borderRadius:99, border:'1px solid var(--lime-glow)',
          }}>● LIVE</div>
          <div style={{ fontSize:9, fontFamily:'var(--font-mono)', letterSpacing:'2px', color:'var(--text-3)', textTransform:'uppercase', marginBottom:6 }}>Active Ride</div>
          <div style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.5px', marginBottom:4 }}>
            {activeRide.from} <span style={{ color:'var(--lime)' }}>→</span> {activeRide.to}
          </div>
          <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--text-2)', marginBottom:14 }}>
            ID: {activeRide.rideId} · ₹{activeRide.fare}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <Btn variant="success" size="sm" onClick={onCompleteRide}>✓ Complete Ride</Btn>
            <Btn variant="ghost"   size="sm" onClick={onViewStress}>📊 View Stress</Btn>
          </div>
        </div>
      )}

      {/* Velocity Card — reads from report */}
      {driver && <VelocityCard report={report} activeRide={activeRide} />}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:22 }}>
        <StatCard label="Total Earned" value={`₹${earned.toFixed(0)}`} sub={`of ₹${target} goal`} accent="lime">
          <ProgressBar pct={pct} />
        </StatCard>
        <StatCard label="Completed Rides" value={rides.length} sub="this shift" accent="cyan" />
        <StatCard label="Goal Status" accent="emerald"
          value={goalMet ? '✓ Met' : 'Active'}
          sub={goalMet ? 'Goal achieved! 🎉' : `₹${remaining.toFixed(0)} remaining`}
        />
        <StatCard label="Shift Ends In" accent="coral"
          value={(driver?.hoursRemaining ?? '—') + " Hours"}
          sub={driver ? 'Ends at ' + (driver.shiftEnd ?? '?') : 'Not started'}
        />
      </div>

      {/* Completed rides */}
      <SectionHeader title="Completed Rides"
        right={<Btn variant="ghost" size="sm" onClick={onRefresh}>↻ Refresh</Btn>}
      />

      {rides.length === 0 ? (
        <Empty icon="🏁" title="No rides completed yet" sub="Accept and complete rides to see them here" />
      ) : (
        <Table
          head={['Ride ID', 'Fare', 'Stress Rating']}
          rows={rides.map(r => [
            <MonoLabel style={{ fontSize:11 }}>{r.rideId}</MonoLabel>,
            <span style={{ color:'var(--lime)', fontWeight:700 }}>₹{r.fare}</span>,
            <Badge color={ratingColor(r.stressRating)}>{r.stressRating || 'N/A'}</Badge>,
          ])}
        />
      )}
    </div>
  );
}