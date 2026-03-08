import { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './hooks/useToast';
import { apiGet, apiPost } from './api';
import Sidebar from './components/Sidebar';
import RegisterModal from './components/RegisterModal';
import Dashboard from './components/Dashboard';
import AvailableRides from './components/AvailableRides';
import StressMonitor from './components/StressMonitor';
import Report from './components/Report';
import { Btn, Spinner } from './components/UI';

function TopBar({ section, driver, onRegister, onEndShift, onGenerate, generating }) {
  const titles = { dashboard:'Dashboard', rides:'Available Rides', stress:'Stress Monitor', report:'Driver Report' };
  return (
    <header style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 28px', borderBottom:'1px solid var(--border)', background:'var(--surface)', position:'sticky', top:0, zIndex:10 }}>
      <div>
        <div style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.5px' }}>{titles[section]}</div>
        <div style={{ fontFamily:'var(--font-mono)', fontSize:10, color:'var(--text-3)', letterSpacing:'1px', marginTop:2 }}>DRIVER OPERATIONS CENTER</div>
      </div>
      <div style={{ display:'flex', gap:10, alignItems:'center' }}>
        <Btn variant="outline" size="sm" onClick={onGenerate} disabled={generating}>
          {generating ? <Spinner size={12} /> : '⚡'} Generate Rides
        </Btn>
        {driver
          ? <Btn variant="danger"  size="sm" onClick={onEndShift}>End Shift</Btn>
          : <Btn variant="primary" size="sm" onClick={onRegister}>🚗 Start Shift</Btn>}
      </div>
    </header>
  );
}

function Inner() {
  const toast = useToast();
  const [section,      setSection]      = useState('dashboard');
  const [showReg,      setShowReg]      = useState(false);
  const [driver,       setDriver]       = useState(null);
  const [activeRide,   setActiveRide]   = useState(null);
  const [rides,        setRides]        = useState([]);
  const [ridesLoading, setRidesLoading] = useState(false);
  const [report,       setReport]       = useState(null);
  const [velocity,     setVelocity]     = useState(null);
  const [generating,   setGenerating]   = useState(false);

  const loadRides = useCallback(async () => {
    setRidesLoading(true);
    try { const d = await apiGet('/rides/available'); setRides(d.rides || []); }
    catch(e) { toast('Could not load rides: ' + e.message, 'error'); }
    finally { setRidesLoading(false); }
  }, [toast]);

  const loadReport = useCallback(async () => {
    if (!driver) return;
    try { const d = await apiGet('/driver/' + driver.driverId + '/report'); setReport(d); } catch {}
  }, [driver]);

  const loadVelocity = useCallback(async () => {
    if (!driver) return;
    try { const d = await apiGet('/driver/' + driver.driverId + '/velocity'); setVelocity(d); } catch {}
  }, [driver]);

  // Section nav side effects
  useEffect(() => {
    if (section === 'rides')  loadRides();
    if (section === 'report') loadReport();
  }, [section, loadRides, loadReport]);

  // On driver login: load report + velocity immediately
  useEffect(() => {
    if (driver) { loadReport(); loadVelocity(); }
  }, [driver, loadReport, loadVelocity]);

  // Poll velocity every 10s
  useEffect(() => {
    if (!driver) return;
    const t = setInterval(loadVelocity, 10000);
    return () => clearInterval(t);
  }, [driver, loadVelocity]);

  async function generateRides() {
    setGenerating(true);
    try {
      const d = await apiPost('/rides/generate');
      toast(`${d.count} rides generated ⚡`, 'success');
      if (section === 'rides') loadRides();
      else setRides(p => [...(d.rides || []), ...p]);
    } catch(e) { toast(e.message, 'error'); }
    finally { setGenerating(false); }
  }

  async function endShift() {
    if (!driver || !window.confirm('End your shift now?')) return;
    try {
      const d = await apiPost('/shift/end', { driverId: driver.driverId });
      toast(`Shift ended. Goal ${d.goalMet ? 'MET ✓' : 'not met'}`, 'info');
      setDriver(null); setReport(null); setActiveRide(null); setVelocity(null);
    } catch(e) { toast(e.message, 'error'); }
  }

  async function completeRide() {
    if (!activeRide) return;
    try {
      const d = await apiPost('/rides/' + activeRide.rideId + '/complete');
      toast(`Ride complete · ${d.stressRating || 'N/A'} stress`, 'success');
      setActiveRide(null);
      loadReport();
      loadVelocity();
    } catch(e) { toast(e.message, 'error'); }
  }

  const nav = (id) => setSection(id);

  const content = {
    dashboard: <Dashboard driver={driver} report={report} velocity={velocity} activeRide={activeRide} onCompleteRide={completeRide} onViewStress={() => nav('stress')} onRefresh={() => { loadReport(); loadVelocity(); }} />,
    rides:     <AvailableRides rides={rides} loading={ridesLoading} onRidesChange={setRides} onRideAccepted={r => { setActiveRide(r); nav('dashboard'); }} driver={driver} hasActiveRide={!!activeRide} />,
    stress:    <StressMonitor activeRideId={activeRide?.rideId} />,
    report:    <Report report={report} onRefresh={loadReport} />,
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, background:'radial-gradient(ellipse 600px 400px at 20% 0%, rgba(200,241,53,0.04) 0%, transparent 70%), radial-gradient(ellipse 400px 400px at 80% 100%, rgba(53,212,241,0.04) 0%, transparent 70%)' }} />
      <Sidebar active={section} onNav={nav} driver={driver} />
      <div style={{ flex:1, display:'flex', flexDirection:'column', position:'relative', zIndex:1, minWidth:0 }}>
        <TopBar section={section} driver={driver} onRegister={() => setShowReg(true)} onEndShift={endShift} onGenerate={generateRides} generating={generating} />
        <main style={{ flex:1, padding:'28px 32px', overflowY:'auto', animation:'fadeUp 0.25s ease' }}>{content[section]}</main>
      </div>
      <RegisterModal open={showReg} onClose={() => setShowReg(false)} onRegistered={d => { setDriver(d); setShowReg(false); }} />
      <style>{`@keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }`}</style>
    </div>
  );
}

export default function App() {
  return <ToastProvider><Inner /></ToastProvider>;
}
