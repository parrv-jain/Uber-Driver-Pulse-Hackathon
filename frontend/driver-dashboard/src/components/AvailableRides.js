import { useState } from 'react';
import { Btn, Empty, Spinner, SectionHeader, MonoLabel } from './UI';
import { apiPost } from '../api';
import { useToast } from '../hooks/useToast';

function RideCard({ ride, onAccept, onReject, accepting, rejecting }) {
  return (
    <div style={{
      background:'var(--card)', border:'1px solid var(--border)',
      borderRadius:'var(--r-lg)', padding:'16px 20px',
      display:'flex', alignItems:'center', justifyContent:'space-between', gap:20,
      transition:'all 0.18s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor='var(--border-hi)'; e.currentTarget.style.transform='translateX(3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.transform=''; }}
    >
      {/* Route */}
      <div style={{ display:'flex', alignItems:'center', gap:14, minWidth:0 }}>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, flexShrink:0 }}>
          <div style={{ width:9, height:9, borderRadius:'50%', background:'var(--lime)', boxShadow:'0 0 6px var(--lime)' }} />
          <div style={{ width:1, height:26, background:'linear-gradient(to bottom, var(--lime), var(--cyan))' }} />
          <div style={{ width:9, height:9, borderRadius:'50%', background:'var(--cyan)', boxShadow:'0 0 6px var(--cyan)' }} />
        </div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ride.from}</div>
          <div style={{ fontSize:12, color:'var(--text-2)', marginTop:4, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>→ {ride.to}</div>
        </div>
      </div>

      {/* Meta */}
      <div style={{ display:'flex', gap:20, flexShrink:0 }}>
        {[
          { val:`₹${ride.fare}`,          key:'Fare',     color:'var(--lime)' },
          { val:`${ride.distanceKm} km`,  key:'Dist',     color:'var(--cyan)' },
          { val:`${ride.durationMin} min`,key:'ETA',      color:'var(--text)' },
        ].map(m => (
          <div key={m.key} style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:13, fontWeight:700, color:m.color }}>{m.val}</div>
            <div style={{ fontSize:10, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'1px', marginTop:2 }}>{m.key}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:8, flexShrink:0 }}>
        <Btn variant="success" size="sm" onClick={() => onAccept(ride)} disabled={accepting}>
          {accepting ? <Spinner size={12} /> : '✓ Accept'}
        </Btn>
        <Btn variant="ghost" size="sm" onClick={() => onReject(ride.requestId)} disabled={rejecting}>
          {rejecting ? <Spinner size={12} /> : '✕'}
        </Btn>
      </div>
    </div>
  );
}

export default function AvailableRides({ rides, loading, onRidesChange, onRideAccepted, driver, hasActiveRide }) {
  const toast = useToast();
  const [accepting, setAccepting] = useState(null);
  const [rejecting, setRejecting] = useState(null);

  async function accept(ride) {
    if (!driver) { toast('Register as a driver first', 'error'); return; }
    if (hasActiveRide) { toast('Complete your current ride first', 'error'); return; }
    setAccepting(ride.requestId);
    try {
      const data = await apiPost('/rides/accept', { driverId: driver.driverId, requestId: ride.requestId });
      onRideAccepted({ ...data, from: ride.from, to: ride.to });
      onRidesChange(rides.filter(r => r.requestId !== ride.requestId));
      toast(`Ride accepted! ${ride.from} → ${ride.to}`, 'success');
    } catch(e) {
      toast('Failed: ' + e.message, 'error');
    } finally {
      setAccepting(null);
    }
  }

  async function reject(requestId) {
    setRejecting(requestId);
    try {
      await apiPost('/rides/reject', { requestId });
      onRidesChange(rides.filter(r => r.requestId !== requestId));
      toast('Ride rejected', 'info');
    } catch(e) {
      toast('Error: ' + e.message, 'error');
    } finally {
      setRejecting(null);
    }
  }

  return (
    <div>
      <SectionHeader title="Available Rides" right={
        <MonoLabel>{rides.length} available</MonoLabel>
      } />

      {loading ? (
        <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size={28} /></div>
      ) : rides.length === 0 ? (
        <Empty icon="🚦" title="No ride requests available" sub="Click Generate Rides in the top bar to get new requests" />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {rides.map(r => (
            <RideCard key={r.requestId} ride={r}
              onAccept={accept} onReject={reject}
              accepting={accepting === r.requestId}
              rejecting={rejecting === r.requestId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
