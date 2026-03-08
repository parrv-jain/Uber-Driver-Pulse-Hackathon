import { useState } from 'react';
import { Modal, Btn, Input } from './UI';
import { apiPost } from '../api';
import { useToast } from '../hooks/useToast';

export default function RegisterModal({ open, onClose, onRegistered }) {
  const toast = useToast();
  const [name, setName]   = useState('');
  const [goal, setGoal]   = useState('1000');
  const [hours, setHours] = useState('8');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!name.trim()) { toast('Please enter your name', 'error'); return; }
    setLoading(true);
    try {
      const data = await apiPost('/driver/register', {
        name: name.trim(),
        earningGoal: parseFloat(goal) || 1000,
        shiftHours:  parseInt(hours) || 8,
      });
      toast(`Welcome, ${data.name}! Shift started 🚗`, 'success');
      onRegistered(data);
      onClose();
    } catch(e) {
      toast('Registration failed: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:24 }}>
        <div style={{ width:42, height:42, background:'var(--lime)', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🚗</div>
        <div>
          <div style={{ fontSize:20, fontWeight:800, letterSpacing:'-0.5px' }}>Start Your Shift</div>
          <div style={{ fontSize:12, color:'var(--text-2)' }}>Register to begin accepting rides</div>
        </div>
      </div>

      <Input label="Full Name" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Rahul Verma" />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Input label="Earning Goal (₹)" value={goal} onChange={e=>setGoal(e.target.value)} type="number" placeholder="1000" />
        <Input label="Shift Hours" value={hours} onChange={e=>setHours(e.target.value)} type="number" placeholder="8" />
      </div>

      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:6 }}>
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={submit} disabled={loading}>
          {loading ? '…' : '🚀 Start Shift'}
        </Btn>
      </div>
    </Modal>
  );
}
