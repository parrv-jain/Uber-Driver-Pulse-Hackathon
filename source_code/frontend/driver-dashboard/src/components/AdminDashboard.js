import { useEffect, useState, useCallback } from 'react';
import { apiGet } from '../api';
import { Badge, Card, StatCard, SectionHeader, Btn, Empty, Spinner, Table, MonoLabel } from './UI';

function stressColor(r) {
  if (!r || r === 'N/A') return 'gray';
  const s = r.toUpperCase();
  if (s.includes('LOW'))    return 'green';
  if (s.includes('MEDIUM')) return 'yellow';
  if (s.includes('HIGH'))   return 'red';
  return 'gray';
}

function statusColor(s) {
  if (!s) return 'gray';
  if (s === 'ONGOING')   return 'blue';
  if (s === 'COMPLETED') return 'green';
  return 'gray';
}

// ── CSV Download Section ──────────────────────────────────────────
function CsvDownloadSection() {
  const [downloading, setDownloading] = useState(null);

  const files = [
    {
      id: 'flagged',
      label: 'Flagged Moments',
      icon: '🚨',
      desc: 'All stress-flagged events with scores and explanations',
      color: 'var(--coral)',
      colorDim: 'rgba(241,96,53,0.08)',
      colorBorder: 'rgba(241,96,53,0.2)',
      endpoint: '/admin/csv/flagged-moments',
      filename: 'flagged_moments.csv',
    },
    {
      id: 'ride',
      label: 'Ride Summary',
      icon: '🚗',
      desc: 'Summary of all completed rides with fare and stress rating',
      color: 'var(--lime)',
      colorDim: 'rgba(200,241,53,0.08)',
      colorBorder: 'rgba(200,241,53,0.2)',
      endpoint: '/admin/csv/ride-summary',
      filename: 'ride_summary_log.csv',
    },
    {
      id: 'audio',
      label: 'Audio Sensor Log',
      icon: '🔊',
      desc: 'Raw audio sensor readings with decibels and duration',
      color: 'var(--cyan)',
      colorDim: 'rgba(53,212,241,0.08)',
      colorBorder: 'rgba(53,212,241,0.2)',
      endpoint: '/admin/csv/audio-log',
      filename: 'audio_sensor_log.csv',
    },
    {
      id: 'motion',
      label: 'Motion Sensor Log',
      icon: '📳',
      desc: 'Raw motion sensor readings with acceleration and location',
      color: 'var(--emerald)',
      colorDim: 'rgba(53,241,126,0.08)',
      colorBorder: 'rgba(53,241,126,0.2)',
      endpoint: '/admin/csv/motion-log',
      filename: 'motion_sensor_log.csv',
    },
    {
      id: 'earningVelocity',
      label: 'Earning Velocity Log',
      icon: '💰',
      desc: 'Driver earning velocity snapshots tracked over shift duration',
      color: 'var(--rose)',
      colorDim: 'rgba(241,53,112,0.08)',
      colorBorder: 'rgba(241,53,112,0.2)',
      endpoint: '/admin/csv/earning-velocity-log',
      filename: 'earning_velocity_log.csv',
    },
  ];

  async function downloadCsv(file) {
    setDownloading(file.id);
    try {
      const res = await fetch('/api' + file.endpoint);
      if (!res.ok) throw new Error('Failed to fetch');
      const text = await res.text();
      // Create blob and trigger download
      const blob = new Blob([text], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Could not download ' + file.filename + '. Make sure the backend is running.');
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div style={{ marginTop: 28 }}>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px' }}>📥 Download CSV Reports</div>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '2px',
          color: 'var(--text-3)', background: 'var(--bg)',
          border: '1px solid var(--border)', borderRadius: 99, padding: '2px 8px',
        }}>ADMIN ONLY</span>
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 18 }}>
        Download raw sensor and ride data logs for offline analysis.
      </div>

      {/* Download cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {files.map(file => {
          const isDownloading = downloading === file.id;
          return (
            <div key={file.id} style={{
              background: file.colorDim,
              border: `1px solid ${file.colorBorder}`,
              borderRadius: 'var(--r-lg)', padding: '18px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'rgba(0,0,0,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
                }}>{file.icon}</div>
                {/* Info */}
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: file.color, marginBottom: 3 }}>{file.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>{file.desc}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>{file.filename}</div>
                </div>
              </div>

              {/* Download button */}
              <button
                onClick={() => downloadCsv(file)}
                disabled={isDownloading}
                style={{
                  flexShrink: 0, padding: '8px 16px',
                  borderRadius: 99, cursor: isDownloading ? 'not-allowed' : 'pointer',
                  background: file.color, border: 'none',
                  color: '#0a0a0a', fontSize: 12, fontWeight: 700,
                  opacity: isDownloading ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!isDownloading) e.currentTarget.style.filter = 'brightness(1.1)'; }}
                onMouseLeave={e => e.currentTarget.style.filter = ''}
              >
                {isDownloading ? '⏳' : '⬇'} {isDownloading ? 'Downloading...' : 'Download'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Summary stat cards ────────────────────────────────────────────
function AdminStats({ stats }) {
  if (!stats) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
      <StatCard label="Total Rides"       value={stats.totalRides}      sub="all time"         accent="cyan"    />
      <StatCard label="Ongoing Rides"     value={stats.ongoingRides}    sub="right now"        accent="lime"    />
      <StatCard label="Completed Rides"   value={stats.completedRides}  sub="this session"     accent="emerald" />
      <StatCard label="Total Flags"       value={stats.totalFlags}      sub="audio + motion"   accent="coral"   />
      <StatCard label="High Stress Rides" value={stats.highStressRides} sub="needs attention"  accent="rose"    />
      <StatCard label="Total Revenue"     value={`₹${(stats.totalRevenue || 0).toFixed(0)}`} sub="completed rides" accent="lime" />
    </div>
  );
}

// ── All Rides table ───────────────────────────────────────────────
function AllRidesTable({ rides, loading }) {
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={28} /></div>;
  if (!rides || rides.length === 0) return <Empty icon="🚗" title="No rides yet" sub="Rides will appear here once drivers start accepting them" />;
  return (
    <Table
      head={['Ride ID', 'Driver', 'Route', 'Fare', 'Status', 'Stress', 'Flags', 'Start Time']}
      rows={rides.map(r => [
        <MonoLabel style={{ fontSize: 11 }}>{r.rideId}</MonoLabel>,
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{r.driverName}</div>
          <MonoLabel style={{ fontSize: 10 }}>{r.driverId}</MonoLabel>
        </div>,
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{r.from}</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>→ {r.to}</div>
        </div>,
        <span style={{ color: 'var(--lime)', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>₹{r.fare}</span>,
        <Badge color={statusColor(r.status)}>{r.status}</Badge>,
        <Badge color={stressColor(r.stressRating)}>{r.stressRating || 'N/A'}</Badge>,
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {r.audioFlags  > 0 && <Badge color="orange">🔊 {r.audioFlags}</Badge>}
          {r.motionFlags > 0 && <Badge color="blue">📳 {r.motionFlags}</Badge>}
          {r.totalFlags === 0 && <Badge color="green">Clean</Badge>}
        </div>,
        <MonoLabel style={{ fontSize: 10 }}>{r.startTime !== 'N/A' ? r.startTime.slice(11, 19) : '—'}</MonoLabel>,
      ])}
    />
  );
}

// ── Flagged Moments table ─────────────────────────────────────────
function FlaggedMomentsTable({ moments, loading }) {
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={28} /></div>;
  if (!moments || moments.length === 0) return <Empty icon="🚦" title="No flagged moments" sub="Flagged events will appear here during rides" />;

  function levelColor(l) {
    if (!l) return 'gray';
    const s = l.toUpperCase();
    if (s === 'LOW' || s === 'QUIET' || s === 'SMOOTH') return 'green';
    if (s === 'MEDIUM' || s === 'MODERATE' || s === 'CONVERSATIONAL') return 'yellow';
    if (s === 'HIGH' || s === 'HARSH' || s === 'ARGUMENT') return 'red';
    return 'gray';
  }

  return (
    <Table
      head={['Flag ID', 'Trip ID', 'Driver', 'Time', 'Motion Score', 'Motion Level', 'Audio Score', 'Audio Level', 'Stress', 'Explanation']}
      rows={moments.map(m => [
        <MonoLabel style={{ fontSize: 10 }}>{m.flag_id}</MonoLabel>,
        <MonoLabel style={{ fontSize: 10 }}>{m.trip_id}</MonoLabel>,
        <MonoLabel style={{ fontSize: 10 }}>{m.driver_id}</MonoLabel>,
        <MonoLabel style={{ fontSize: 10 }}>{m.timestamp ? m.timestamp.slice(11, 19) : '—'}</MonoLabel>,
        <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{parseFloat(m.motion_score || 0).toFixed(2)}</span>,
        <Badge color={levelColor(m.motion_rating)}>{m.motion_rating || '—'}</Badge>,
        <span style={{ color: 'var(--lime)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{parseFloat(m.audio_score || 0).toFixed(2)}</span>,
        <Badge color={levelColor(m.audio_rating)}>{m.audio_rating || '—'}</Badge>,
        <Badge color={stressColor(m.stress_rating)}>{m.stress_rating || '—'}</Badge>,
        <span style={{ fontSize: 11, color: 'var(--text-2)', maxWidth: 260, display: 'block' }}>{m.explanation}</span>,
      ])}
    />
  );
}

// ── Main Admin Dashboard ──────────────────────────────────────────
export default function AdminDashboard() {
  const [stats,          setStats]          = useState(null);
  const [rides,          setRides]          = useState([]);
  const [flagged,        setFlagged]        = useState([]);
  const [statsLoading,   setStatsLoading]   = useState(false);
  const [ridesLoading,   setRidesLoading]   = useState(false);
  const [flaggedLoading, setFlaggedLoading] = useState(false);
  const [activeTab,      setActiveTab]      = useState('rides');

  const loadAll = useCallback(async () => {
    setStatsLoading(true); setRidesLoading(true); setFlaggedLoading(true);
    try { const s = await apiGet('/admin/dashboard'); setStats(s); } catch {} finally { setStatsLoading(false); }
    try { const r = await apiGet('/admin/rides');     setRides(r.rides || []); } catch {} finally { setRidesLoading(false); }
    try { const f = await apiGet('/admin/flagged-moments'); setFlagged(f.flaggedMoments || []); } catch {} finally { setFlaggedLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { const t = setInterval(loadAll, 15000); return () => clearInterval(t); }, [loadAll]);

  const tabs = [
    { id: 'rides',   label: '🚗 All Rides',      count: rides.length   },
    { id: 'flagged', label: '🚨 Flagged Moments', count: flagged.length },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div>
          <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 4 }}>Uber Admin · Operations View</div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>Admin Dashboard</div>
        </div>
        <Btn variant="ghost" size="sm" onClick={loadAll}>↻ Refresh</Btn>
      </div>

      {/* Stats */}
      {statsLoading
        ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28} /></div>
        : <AdminStats stats={stats} />
      }

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {tabs.map(tab => (
          <div key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '8px 18px', borderRadius: 99, cursor: 'pointer',
            fontSize: 13, fontWeight: 700,
            background: activeTab === tab.id ? 'var(--lime)' : 'var(--card)',
            color:      activeTab === tab.id ? '#0a0a0a'     : 'var(--text-2)',
            border:     activeTab === tab.id ? 'none'        : '1px solid var(--border)',
            transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {tab.label}
            <span style={{
              background: activeTab === tab.id ? 'rgba(0,0,0,0.2)' : 'var(--bg)',
              color:      activeTab === tab.id ? '#0a0a0a'          : 'var(--text-3)',
              borderRadius: 99, padding: '1px 7px', fontSize: 11, fontFamily: 'var(--font-mono)',
            }}>{tab.count}</span>
          </div>
        ))}
      </div>

      {/* Tab content */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
          <SectionHeader
            title={activeTab === 'rides' ? 'All Rides — Ongoing & Completed' : 'Flagged Moments — Stress Events'}
            right={<MonoLabel>{activeTab === 'rides' ? rides.length : flagged.length} records</MonoLabel>}
          />
        </div>
        <div>
          {activeTab === 'rides'
            ? <AllRidesTable rides={rides} loading={ridesLoading} />
            : <FlaggedMomentsTable moments={flagged} loading={flaggedLoading} />
          }
        </div>
      </Card>

      {/* CSV Downloads */}
      <CsvDownloadSection />
    </div>
  );
}