import { useEffect, useState, useCallback } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Legend,
} from 'recharts';
import { Card, Badge, SectionHeader, Btn, Empty, Spinner, Table, MonoLabel } from './UI';
import { apiGet } from '../api';

// ── Helpers ────────────────────────────────────────────────────────────────────

function paceColor(status) {
  if (!status) return 'gray';
  const s = status.toUpperCase();
  if (s === 'ON_TRACK'  || s === 'ON TRACK')  return 'green';
  if (s === 'AHEAD'     || s === 'FAST')       return 'lime';   // custom var
  if (s === 'BEHIND'    || s === 'SLOW')       return 'yellow';
  if (s === 'CRITICAL'  || s === 'FAR_BEHIND') return 'red';
  return 'gray';
}

function paceIcon(status) {
  if (!status) return '—';
  const s = status.toUpperCase();
  if (s.includes('AHEAD') || s.includes('FAST'))    return '🚀';
  if (s.includes('ON'))                              return '✅';
  if (s.includes('BEHIND') || s.includes('SLOW'))   return '⚠️';
  if (s.includes('CRITICAL') || s.includes('FAR'))  return '🔴';
  return '📊';
}

const COLORS = {
  current:  '#c8f135',   // lime  — matches lime in existing palette
  required: '#35d4f1',   // cyan
  delta:    '#f16035',   // coral / orange
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border-hi)',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
      fontFamily: 'var(--font-mono)',
    }}>
      <div style={{ color: 'var(--text-3)', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </div>
      ))}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

export default function EarningVelocityMonitor({ activeRideId }) {
  const [snaps,   setSnaps]   = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!activeRideId) return;
    try {
      const data = await apiGet('/rides/' + activeRideId + '/stress');
      setSnaps(data.snapshots || []);
    } catch { /* silent — same as StressMonitor */ }
  }, [activeRideId]);

  // Auto-refresh every 5 s when there's an active ride
  useEffect(() => {
    if (!activeRideId) return;
    setLoading(true);
    load().finally(() => setLoading(false));
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [activeRideId, load]);

  // ── Derived state ────────────────────────────────────────────────────────────
  const last = snaps[snaps.length - 1];

  const chartData = snaps.map((s, i) => ({
    time:     s.timestamp?.slice(0, 5) || `T${i}`,
    Current:  +(s.currentVelocity  ?? 0).toFixed(2),
    Required: +(s.requiredVelocity ?? 0).toFixed(2),
    Delta:    +(s.velocityDelta    ?? 0).toFixed(2),
  }));

  // ── Cards meta ───────────────────────────────────────────────────────────────
  const cards = [
    {
      label: 'Current Velocity',
      val:   last?.currentVelocity,
      unit:  '₹/hr',
      color: COLORS.current,
      sub:   null,
    },
    {
      label: 'Required Velocity',
      val:   last?.requiredVelocity,
      unit:  '₹/hr',
      color: COLORS.required,
      sub:   null,
    },
    {
      label: 'Velocity Delta',
      val:   last?.velocityDelta,
      unit:  '₹/hr',
      color: last?.velocityDelta != null
        ? (last.velocityDelta >= 0 ? COLORS.current : COLORS.delta)
        : 'var(--text-3)',
      sub: last?.velocityDelta != null
        ? (last.velocityDelta >= 0 ? '▲ Ahead of pace' : '▼ Behind pace')
        : null,
    },
    {
      label: 'Pace Status',
      val:   null,
      unit:  null,
      color: 'var(--text-1)',
      badge: last?.paceStatus,
      icon:  paceIcon(last?.paceStatus),
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ marginTop: 32 }}>
      {/* Divider with label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
      }}>
        <div style={{
          flex: 1,
          height: 1,
          background: 'linear-gradient(90deg, var(--border) 0%, transparent 100%)',
        }} />
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '2.5px',
          color: 'var(--text-3)',
          textTransform: 'uppercase',
          padding: '4px 12px',
          border: '1px solid var(--border)',
          borderRadius: 99,
          background: 'var(--surface)',
        }}>
          💰 Earning Velocity
        </div>
        <div style={{
          flex: 1,
          height: 1,
          background: 'linear-gradient(90deg, transparent 0%, var(--border) 100%)',
        }} />
      </div>

      <SectionHeader
        title="Earning Velocity Monitor"
        right={
          <Btn variant="ghost" size="sm" onClick={load}>↻ Refresh</Btn>
        }
      />

      {!activeRideId ? (
        <Empty
          icon="💸"
          title="No active ride"
          sub="Accept a ride to track your earning velocity in real time"
        />
      ) : loading && snaps.length === 0 ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <Spinner size={28} />
        </div>
      ) : (
        <>
          {/* ── Score Cards ───────────────────────────────────────────────────── */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 14,
            marginBottom: 20,
          }}>
            {cards.map(item => (
              <Card key={item.label}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: 'var(--text-3)',
                  marginBottom: 8,
                }}>
                  {item.label}
                </div>

                {/* Pace Status card — badge-style */}
                {item.badge !== undefined ? (
                  <>
                    <div style={{ fontSize: 28, lineHeight: 1, marginBottom: 8 }}>
                      {item.icon}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      {item.badge
                        ? <Badge color={paceColor(item.badge)}>{item.badge}</Badge>
                        : <Badge>—</Badge>
                      }
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{
                      fontSize: 28,
                      fontWeight: 800,
                      letterSpacing: '-1px',
                      color: item.color,
                      lineHeight: 1,
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {item.val != null ? item.val.toFixed(2) : '—'}
                      {item.val != null && item.unit && (
                        <span style={{ fontSize: 12, fontWeight: 500, marginLeft: 4, color: 'var(--text-3)' }}>
                          {item.unit}
                        </span>
                      )}
                    </div>
                    {item.sub && (
                      <div style={{
                        marginTop: 8,
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        color: item.color,
                        opacity: 0.8,
                      }}>
                        {item.sub}
                      </div>
                    )}
                  </>
                )}
              </Card>
            ))}
          </div>

          {/* ── Line Chart ────────────────────────────────────────────────────── */}
          {snaps.length > 0 && (
            <Card style={{ marginBottom: 20 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Velocity Timeline</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[
                    ['Current',  COLORS.current],
                    ['Required', COLORS.required],
                    ['Delta',    COLORS.delta],
                  ].map(([k, c]) => (
                    <div key={k} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 11,
                      color: 'var(--text-2)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      <div style={{ width: 20, height: 2, borderRadius: 2, background: c }} />
                      {k}
                    </div>
                  ))}
                </div>
              </div>

              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis
                    dataKey="time"
                    tick={{ fill: '#55557a', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#55557a', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />

                  {/* Zero reference for delta */}
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" />

                  <Line
                    type="monotone"
                    dataKey="Current"
                    stroke={COLORS.current}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: COLORS.current }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Required"
                    stroke={COLORS.required}
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    dot={false}
                    activeDot={{ r: 4, fill: COLORS.required }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Delta"
                    stroke={COLORS.delta}
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 4, fill: COLORS.delta }}
                  />
                </LineChart>
              </ResponsiveContainer>

              <div style={{
                marginTop: 10,
                fontSize: 11,
                fontFamily: 'var(--font-mono)',
                color: 'var(--text-3)',
              }}>
                Required velocity shown as dashed line · Delta = Current − Required
              </div>
            </Card>
          )}

          {/* ── Snapshots Table ───────────────────────────────────────────────── */}
          {snaps.length > 0 && (
            <Card>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
                Velocity Snapshots
              </div>
              <Table
                head={['Time', 'Current (₹/hr)', 'Required (₹/hr)', 'Delta', 'Pace Status']}
                rows={snaps.map(s => {
                  const deltaVal = s.velocityDelta ?? 0;
                  const deltaPositive = deltaVal >= 0;
                  return [
                    <MonoLabel style={{ fontSize: 10 }}>{s.timestamp}</MonoLabel>,

                    <span style={{
                      color: COLORS.current,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                    }}>
                      {s.currentVelocity?.toFixed(2) ?? '—'}
                    </span>,

                    <span style={{
                      color: COLORS.required,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                    }}>
                      {s.requiredVelocity?.toFixed(2) ?? '—'}
                    </span>,

                    <span style={{
                      color: deltaPositive ? COLORS.current : COLORS.delta,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                    }}>
                      {deltaPositive ? '+' : ''}{deltaVal.toFixed(2)}
                    </span>,

                    <Badge color={paceColor(s.paceStatus)}>
                      {paceIcon(s.paceStatus)} {s.paceStatus ?? '—'}
                    </Badge>,
                  ];
                })}
              />
            </Card>
          )}
        </>
      )}
    </div>
  );
}