import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { fetchApi } from '../services/api';
import { getUserContext } from '../services/auth';
import { Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DoctorDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [newSlot, setNewSlot] = useState({ date: '', startTime: '', endTime: '' });
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', specialization: '', clinicName: '', bio: '', qualification: '', experienceYears: '', minimumFees: '' });
  const navigate = useNavigate();

  const sortAppointmentsByDate = (appts) => {
    return [...appts].sort((a, b) => {
      const dateA = a.slotStartTime ? new Date(a.slotStartTime) : new Date(0);
      const dateB = b.slotStartTime ? new Date(b.slotStartTime) : new Date(0);
      return dateB - dateA;
    });
  };

  const sortSlots = (slotsArray) => {
    return [...slotsArray].sort((a, b) => {
      const statusPriority = {
        BOOKED: 2,
        OPEN: 1,
        EXPIRED: 0
      };
      const statusA = getSlotStatus(a);
      const statusB = getSlotStatus(b);
      if (statusPriority[statusB] !== statusPriority[statusA]) {
        return statusPriority[statusB] - statusPriority[statusA];
      }
      const dateA = a?.startTime ? new Date(a.startTime) : new Date(0);
      const dateB = b?.startTime ? new Date(b.startTime) : new Date(0);
      return dateB - dateA;
    });
  };

  const getSlotStatus = (slot) => {
    if (!slot?.endTime) return 'OPEN';
    const isBooked = slot?.booked || slot?.isBooked;
    if (isBooked) return 'BOOKED';
    const hasExpired = new Date(slot.endTime) < new Date();
    return hasExpired ? 'EXPIRED' : 'OPEN';
  };

  useEffect(() => {
    const user = getUserContext();
    if (!user || user.role !== 'DOCTOR') {
      navigate('/login');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        fetchApi('/providers/me'),
        fetchApi('/slots/my'),
        fetchApi('/appointments/provider')
      ]);

      const profData = results[0].status === 'fulfilled' ? results[0].value : null;
      const slotsData = results[1].status === 'fulfilled' ? results[1].value : [];
      const apptData = results[2].status === 'fulfilled' ? results[2].value : [];

      setProfile(profData);
      if (profData) {
        setEditForm({
          name: profData.name || '',
          specialization: profData.specialization || '',
          clinicName: profData.clinicName || '',
          bio: profData.bio || '',
          qualification: profData.qualification || '',
          experienceYears: profData.experienceYears || '',
          minimumFees: profData.minimumFees || ''
        });
      }
      setSlots(sortSlots(Array.isArray(slotsData) ? slotsData.filter(Boolean) : []));
      setAppointments(sortAppointmentsByDate(Array.isArray(apptData) ? apptData.filter(Boolean) : []));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    if (!profile) return;
    try {
      const updated = await fetchApi(`/providers/me/availability?available=${!profile.available}`, { method: 'PUT' });
      setProfile(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const startEditProfile = () => {
    setEditForm({
      name: profile.name || '',
      specialization: profile.specialization || '',
      clinicName: profile.clinicName || '',
      bio: profile.bio || '',
      qualification: profile.qualification || '',
      experienceYears: profile.experienceYears || '',
      minimumFees: profile.minimumFees || ''
    });
    setEditingProfile(true);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      console.log('Sending doctor profile update:', editForm);
      const updated = await fetchApi('/providers/me', {
        method: 'PUT',
        body: JSON.stringify(editForm),
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('Doctor profile update response:', updated);
      if (updated) {
        setProfile(updated);
        setEditingProfile(false);
        await loadData();
        alert("Profile updated successfully!");
      }
    } catch (e) {
      console.error('Doctor profile update error:', e);
      const errorMsg = e.message || "Failed to update profile";
      if (errorMsg.includes("401") || errorMsg.includes("Unauthorized")) {
        alert("Your session has expired. Please login again.");
      } else {
        alert("Error: " + errorMsg);
      }
    }
  };

  const wrapDate = (dateStr, timeStr) => {
    return `${dateStr}T${timeStr}:00`;
  };

  const addSlot = async (e) => {
    e.preventDefault();
    try {
      const start = wrapDate(newSlot.date, newSlot.startTime);
      const end = wrapDate(newSlot.date, newSlot.endTime);
      await fetchApi('/slots', {
        method: 'POST',
        body: JSON.stringify({ startTime: start, endTime: end })
      });
      setNewSlot({ date: '', startTime: '', endTime: '' });
      loadData();
    } catch (e) {
      alert(e.message || "Failed to add slot");
    }
  };

  const removeSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to remove this slot?')) return;
    try {
      await fetchApi(`/slots/${slotId}`, { method: 'DELETE' });
      loadData();
    } catch (e) {
      const errorMsg = e.message || "Failed to delete slot.";
      if (errorMsg.toLowerCase().includes("booked")) {
        alert("Cannot delete slot that has appointments. Please cancel the appointment first.");
      } else {
        alert(errorMsg);
      }
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--pk-bg)' }}>
      <Navbar />
      
      <div className="container" style={{ padding: '2rem 1rem' }}>
        <h1 className="mb-6">Doctor Portal</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Left Column: Profile (top), Upcoming Appointments (bottom) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>My Profile</h2>
                {!editingProfile && (
                  <button onClick={startEditProfile} className="btn btn-secondary" style={{ fontSize: '0.875rem' }}>
                    Edit Profile
                  </button>
                )}
              </div>
              {editingProfile ? (
                <form onSubmit={saveProfile}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="form-input"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Specialization</label>
                      <input
                        type="text"
                        value={editForm.specialization}
                        onChange={(e) => setEditForm({...editForm, specialization: e.target.value})}
                        className="form-input"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Clinic Name</label>
                      <input
                        type="text"
                        value={editForm.clinicName}
                        onChange={(e) => setEditForm({...editForm, clinicName: e.target.value})}
                        className="form-input"
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Qualification</label>
                      <input
                        type="text"
                        value={editForm.qualification}
                        onChange={(e) => setEditForm({...editForm, qualification: e.target.value})}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Experience (Years)</label>
                      <input
                        type="number"
                        value={editForm.experienceYears}
                        onChange={(e) => setEditForm({...editForm, experienceYears: parseInt(e.target.value) || 0})}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Bio</label>
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                        className="form-input"
                        style={{ minHeight: '80px', resize: 'vertical' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Minimum Consultation Fees ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editForm.minimumFees}
                        onChange={(e) => setEditForm({...editForm, minimumFees: parseFloat(e.target.value) || 0})}
                        className="form-input"
                        placeholder="Enter minimum fees"
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button type="submit" className="btn btn-primary">Save Changes</button>
                      <button type="button" onClick={() => setEditingProfile(false)} className="btn btn-secondary">Cancel</button>
                    </div>
                  </div>
                </form>
              ) : (
                <div>
                  <p><strong>Name:</strong> {profile?.name}</p>
                  <p><strong>Specialization:</strong> {profile?.specialization}</p>
                  <p><strong>Clinic:</strong> {profile?.clinicName}</p>
                  <p><strong>Qualification:</strong> {profile?.qualification || 'Not provided'}</p>
                  <p><strong>Experience:</strong> {profile?.experienceYears || 0} years</p>
                  <p><strong>Minimum Fees:</strong> ${profile?.minimumFees || 'Not set'}</p>
                  <p><strong>Status:</strong> {profile?.verified ? <span className="badge badge-success">Verified</span> : <span className="badge badge-danger">Pending</span>}</p>

                  <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Currently Accepting:</span>
                    <button
                      onClick={toggleAvailability}
                      className={profile?.available ? 'btn btn-primary' : 'btn btn-outline'}
                      style={profile?.available ? { backgroundColor: 'var(--pk-danger)', color: 'white' } : {}}
                    >
                      {profile?.available ? 'Stop Accepting' : 'Start Accepting'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="mb-4">Upcoming Appointments</h2>
              {appointments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {appointments.map(appt => (
                    <div key={appt.id} style={{ padding: '1rem', border: '1px solid var(--pk-border)', borderRadius: 'var(--pk-radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>Patient Name:</strong> {appt.patientName || 'Patient'}
                        {appt.slotStartTime && (
                          <div className="text-muted mt-2" style={{ fontSize: '0.875rem' }}>
                            {new Date(appt.slotStartTime).toLocaleDateString()} | {new Date(appt.slotStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            {appt.slotEndTime && ` - ${new Date(appt.slotEndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                          </div>
                        )}
                        <div className="text-muted mt-2" style={{ fontSize: '0.875rem' }}>Notes: {appt.notes || 'No notes'}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="badge badge-success mb-2">{appt.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted">No appointments booked yet.</p>
              )}
            </div>

          </div>

          {/* Right Column: Add Slot (top), My Slots (bottom) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Add Availability Slot</h2>
              <form onSubmit={addSlot}>
                <div className="input-group">
                  <label className="input-label">Date</label>
                  <input type="date" required className="input-field" value={newSlot.date} onChange={e => setNewSlot({...newSlot, date: e.target.value})} />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">Start Time</label>
                    <input type="time" required className="input-field" value={newSlot.startTime} onChange={e => setNewSlot({...newSlot, startTime: e.target.value})} />
                  </div>
                  <div className="input-group" style={{ flex: 1 }}>
                    <label className="input-label">End Time</label>
                    <input type="time" required className="input-field" value={newSlot.endTime} onChange={e => setNewSlot({...newSlot, endTime: e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary mt-2" style={{ width: '100%' }}>
                  <Plus size={18} /> Add Slot
                </button>
              </form>
            </div>

            <div className="card">
              <h2 className="mb-4">My Slots</h2>
              {slots.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {slots.map(slot => {
                    const slotStatus = getSlotStatus(slot);
                    const isBooked = slotStatus === 'BOOKED';
                    const isExpired = slotStatus === 'EXPIRED';

                    return (
                     <div key={slot?.id} style={{ padding: '1rem', border: '1px solid var(--pk-border)', borderRadius: 'var(--pk-radius-sm)', position: 'relative' }}>
                       <div style={{ fontWeight: '500', marginBottom: '0.5rem' }}>{slot?.startTime ? new Date(slot.startTime).toLocaleDateString() : 'Invalid Date'}</div>
                       <div className="text-muted" style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                         {slot?.startTime ? new Date(slot.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'} -
                         {slot?.endTime ? new Date(slot.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         {isBooked ? (
                           <span className="badge badge-danger">Booked</span>
                         ) : isExpired ? (
                           <span className="badge badge-danger">Expired</span>
                         ) : (
                           <span className="badge badge-success">Open</span>
                         )}
                         {!isBooked && (
                           <button
                             onClick={() => removeSlot(slot?.id)}
                             className="btn btn-danger"
                             style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                             title="Remove slot"
                           >
                             <Trash2 size={16} style={{ marginRight: '0.25rem' }} />
                             Delete
                           </button>
                         )}
                       </div>
                     </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted">You haven't added any slots yet.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
