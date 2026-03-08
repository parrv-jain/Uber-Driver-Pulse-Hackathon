import { Card, StatCard, ProgressBar, Badge, Btn, SectionHeader, Empty, Table, MonoLabel } from './UI';

function ratingColor(r) {
  if (!r || r === 'N/A') return 'gray';
  const s = r.toUpperCase();
  if (s.includes('LOW'))    return 'green';
  if (s.includes('MEDIUM')) return 'yellow';
  if (s.includes('HIGH'))   return 'red';
  return 'gray';
}

export default function Report({ report, onRefresh }) {
  if (!report) return (
    <Empty icon="📋" title="No report available" sub="Register and complete rides to generate your report" />
  );

  const { currentEarned, targetAmount, remaining, goalMet, completedRides = [], name } = report;
  const pct = targetAmount > 0 ? (currentEarned / targetAmount) * 100 : 0;
  const avg = completedRides.length > 0 ? (currentEarned / completedRides.length).toFixed(0) : 0;

  return (
    <div>
      <SectionHeader title="Driver Report"
        right={<Btn variant="ghost" size="sm" onClick={onRefresh}>↻ Refresh</Btn>}
      />

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:22 }}>
        <Card accent="lime">
          <div style={{ fontFamily:'var(--font-mono)', fontSize:10, letterSpacing:'2px', textTransform:'uppercase', color:'var(--text-3)', marginBottom:8 }}>Earnings Summary</div>
          <div style={{ fontSize:34, fontWeight:800, letterSpacing:'-1.5px', lineHeight:1 }}>₹{currentEarned.toFixed(0)}</div>
          <div style={{ fontSize:12, color:'var(--text-2)', marginTop:6 }}>Target: ₹{targetAmount}</div>
          <ProgressBar pct={pct} />
          <div style={{ marginTop:10 }}>
            {goalMet
              ? <Badge color="green">✓ Goal Met</Badge>
              : <Badge color="yellow">₹{remaining?.toFixed(0)} remaining</Badge>}
          </div>
        </Card>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <StatCard label="Rides Completed" value={completedRides.length} sub={`Avg ₹${avg} / ride`} accent="cyan" />
          <StatCard label="Status" accent="emerald"
            value={goalMet ? '🎉 Done' : '⏳ Active'}
            sub={goalMet ? 'Earning goal achieved' : 'Keep going!'}
          />
        </div>
      </div>

      {/* Rides table */}
      <div style={{ fontSize:17, fontWeight:700, letterSpacing:'-0.3px', marginBottom:14 }}>All Completed Rides</div>
      {completedRides.length === 0 ? (
        <Empty icon="🏁" title="No rides yet" sub="" />
      ) : (
        <Table
          head={['Ride ID', 'Fare', 'Stress Rating']}
          rows={completedRides.map(r => [
            <MonoLabel style={{ fontSize:11 }}>{r.rideId}</MonoLabel>,
            <span style={{ color:'var(--lime)', fontWeight:700, fontFamily:'var(--font-mono)' }}>₹{r.fare}</span>,
            <Badge color={ratingColor(r.stressRating)}>{r.stressRating || 'N/A'}</Badge>,
          ])}
        />
      )}
    </div>
  );
}
