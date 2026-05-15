import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { fetchApi } from '../services/api';
import { getUserContext } from '../services/auth';
import { Plus, Trash2, Stethoscope, Calendar, Clock, User, CheckCircle, Activity, CalendarPlus, Users, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DoctorDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [slots, setSlots] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [newSlot, setNewSlot] = useState({ date: '', startTime: '', endTime: '' });
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', specialization: '', clinicName: '', bio: '', qualification: '', experienceYears: '', minimumFees: '' });
  const [activeTab, setActiveTab] = useState('appointments');
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
      return dateA - dateB;
    });
  };

  const getSlotStatus = (slot) => {
    if (!slot?.endTime) return 'OPEN';
    const isBooked = slot?.booked || slot?.isBooked;
    if (isBooked) return 'BOOKED';
    const hasExpired = new Date(slot.endTime) < new Date();
    return hasExpired ? 'EXPIRED' : 'OPEN';
  };

  const isAppointmentCanceled = (appt) => {
    return appt.status?.toUpperCase() === 'CANCELLED' || appt.status?.toUpperCase() === 'CANCELED';
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

  const stats = [
    { 
      icon: <Calendar size={24} />, 
      label: 'Upcoming', 
      value: appointments.filter(a => !isAppointmentCanceled(a)).length,
      color: 'var(--pk-accent)'
    },
    { 
      icon: <CalendarPlus size={24} />, 
      label: 'Available Slots', 
      value: slots.filter(s => getSlotStatus(s) === 'OPEN').length,
      color: 'var(--pk-success)'
    },
    { 
      icon: <Archive size={24} />, 
      label: 'Canceled', 
      value: appointments.filter(a => isAppointmentCanceled(a)).length,
      color: 'var(--pk-danger)'
    }
  ];

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--pk-bg)' }}>
      <Navbar />
      
      <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
        <div className="page-header" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ margin: 0 }}>Doctor Portal</h1>
              <p className="text-muted" style={{ margin: '0.5rem 0 0 0' }}>
                Welcome back, Dr. {profile?.name}! Manage your availability and appointments
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.75rem 1.25rem', 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                border: '1px solid var(--pk-border)',
                boxShadow: 'var(--pk-shadow-sm)'
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: profile?.available ? 'var(--pk-success)' : 'var(--pk-danger)' }}></div>
                <span style={{ fontWeight: 600 }}>
                  {profile?.available ? 'Accepting Patients' : 'Not Accepting'}
                </span>
              </div>
              <button
                onClick={toggleAvailability}
                className={profile?.available ? 'btn btn-danger' : 'btn btn-primary'}
              >
                {profile?.available ? 'Stop Accepting' : 'Start Accepting'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          {stats.map((stat, index) => (
            <div key={index} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>{stat.label}</p>
                  <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{stat.value}</p>
                </div>
                <div style={{ 
                  backgroundColor: `rgba(59, 130, 246, 0.1)`, 
                  color: stat.color,
                  padding: '1rem',
                  borderRadius: '12px'
                }}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          backgroundColor: 'white', 
          padding: '0.5rem',
          borderRadius: '12px',
          border: '1px solid var(--pk-border)',
          marginBottom: '2rem',
          width: 'fit-content',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setActiveTab('appointments')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'appointments' ? 'var(--pk-accent)' : 'transparent',
              color: activeTab === 'appointments' ? 'white' : 'var(--pk-text-main)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Calendar size={18} /> Upcoming
          </button>
          <button
            onClick={() => setActiveTab('canceled')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'canceled' ? 'var(--pk-accent)' : 'transparent',
              color: activeTab === 'canceled' ? 'white' : 'var(--pk-text-main)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Archive size={18} /> Canceled
          </button>
          <button
            onClick={() => setActiveTab('slots')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'slots' ? 'var(--pk-accent)' : 'transparent',
              color: activeTab === 'slots' ? 'white' : 'var(--pk-text-main)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <CalendarPlus size={18} /> My Slots
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'profile' ? 'var(--pk-accent)' : 'transparent',
              color: activeTab === 'profile' ? 'white' : 'var(--pk-text-main)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <User size={18} /> Profile
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'appointments' && (
          <div className="card">
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Calendar size={20} /> Upcoming Appointments
            </div>
            {appointments.filter(a => !isAppointmentCanceled(a)).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {appointments.filter(a => !isAppointmentCanceled(a)).map(appt => (
                  <div 
                    key={appt.id} 
                    style={{ 
                      padding: '1.5rem', 
                      border: '1px solid var(--pk-border)', 
                      borderRadius: '12px',
                      backgroundColor: 'var(--pk-surface)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                          width: '48px', 
                          height: '48px', 
                          borderRadius: '50%', 
                          backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: 'var(--pk-accent)'
                        }}>
                          <User size={22} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.25rem' }}>
                            Patient: {appt.patientName || 'Patient'}
                          </div>
                          {appt.slotStartTime && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <Calendar size={16} style={{ color: 'var(--pk-text-muted)' }} />
                                <span className="text-sm text-muted">
                                  {new Date(appt.slotStartTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <Clock size={16} style={{ color: 'var(--pk-text-muted)' }} />
                                <span className="text-sm text-muted">
                                  {new Date(appt.slotStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  {appt.slotEndTime && ` - ${new Date(appt.slotEndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                                </span>
                              </div>
                            </div>
                          )}
                          {appt.notes && (
                            <div style={{ 
                              marginTop: '1rem', 
                              padding: '1rem', 
                              backgroundColor: 'var(--pk-bg)', 
                              borderRadius: '8px',
                              border: '1px solid var(--pk-border)'
                            }}>
                              <p className="text-sm" style={{ margin: 0 }}>
                                <strong>Notes:</strong> {appt.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="badge badge-success">{appt.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <Calendar size={48} style={{ color: 'var(--pk-text-muted)', marginBottom: '1rem' }} />
                <p className="text-muted" style={{ margin: 0 }}>No upcoming appointments.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'canceled' && (
          <div className="card">
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Archive size={20} /> Canceled Appointments
            </div>
            {appointments.filter(a => isAppointmentCanceled(a)).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {appointments.filter(a => isAppointmentCanceled(a)).map(appt => (
                  <div 
                    key={appt.id} 
                    style={{ 
                      padding: '1.5rem', 
                      border: '1px solid var(--pk-border)', 
                      borderRadius: '12px',
                      backgroundColor: 'var(--pk-surface)',
                      opacity: 0.8
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ 
                          width: '48px', 
                          height: '48px', 
                          borderRadius: '50%', 
                          backgroundColor: 'rgba(220, 38, 38, 0.1)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: 'var(--pk-danger)'
                        }}>
                          <User size={22} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.25rem' }}>
                            Patient: {appt.patientName || 'Patient'}
                          </div>
                          {appt.slotStartTime && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <Calendar size={16} style={{ color: 'var(--pk-text-muted)' }} />
                                <span className="text-sm text-muted">
                                  {new Date(appt.slotStartTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                <Clock size={16} style={{ color: 'var(--pk-text-muted)' }} />
                                <span className="text-sm text-muted">
                                  {new Date(appt.slotStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  {appt.slotEndTime && ` - ${new Date(appt.slotEndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="badge badge-danger">{appt.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <Archive size={48} style={{ color: 'var(--pk-text-muted)', marginBottom: '1rem' }} />
                <p className="text-muted" style={{ margin: 0 }}>No canceled appointments.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'slots' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* Add Slot */}
            <div className="card">
              <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <Plus size={20} /> Add Availability Slot
              </div>
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
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                  <Plus size={18} /> Add Slot
                </button>
              </form>
            </div>

            {/* My Slots */}
            <div className="card" style={{ flex: 1 }}>
              <div className="section-title" style={{ marginBottom: '1.5rem' }}>My Slots</div>
              {slots.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                  {slots.map(slot => {
                    const slotStatus = getSlotStatus(slot);
                    const isBooked = slotStatus === 'BOOKED';
                    const isExpired = slotStatus === 'EXPIRED';

                    return (
                     <div 
                      key={slot?.id} 
                      style={{ 
                        padding: '1.25rem', 
                        border: '1px solid var(--pk-border)', 
                        borderRadius: '12px',
                        backgroundColor: 'var(--pk-surface)',
                        position: 'relative'
                      }}
                    >
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                         <Calendar size={16} style={{ color: 'var(--pk-accent)' }} />
                         <div style={{ fontWeight: 600 }}>
                           {slot?.startTime ? new Date(slot.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : 'Invalid Date'}
                         </div>
                       </div>
                       <div className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
                         <Clock size={14} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} />
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
                             className="btn btn-danger btn-sm"
                             title="Remove slot"
                           >
                             <Trash2 size={16} />
                           </button>
                         )}
                       </div>
                     </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <CalendarPlus size={40} style={{ color: 'var(--pk-text-muted)', marginBottom: '1rem' }} />
                  <p className="text-muted" style={{ margin: 0 }}>You haven't added any slots yet.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--pk-accent)'
                }}>
                  <Stethoscope size={32} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', margin: 0 }}>My Profile</h2>
                  <p className="text-muted" style={{ margin: '0.25rem 0 0 0' }}>{profile?.specialization}</p>
                </div>
              </div>
              {!editingProfile && (
                <button onClick={startEditProfile} className="btn btn-primary">
                  Edit Profile
                </button>
              )}
            </div>
            
            {editingProfile ? (
              <form onSubmit={saveProfile}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">Name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="input-label">Specialization</label>
                    <input
                      type="text"
                      value={editForm.specialization}
                      onChange={(e) => setEditForm({...editForm, specialization: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="input-label">Clinic Name</label>
                    <input
                      type="text"
                      value={editForm.clinicName}
                      onChange={(e) => setEditForm({...editForm, clinicName: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="input-label">Qualification</label>
                    <input
                      type="text"
                      value={editForm.qualification}
                      onChange={(e) => setEditForm({...editForm, qualification: e.target.value})}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="input-label">Experience (Years)</label>
                    <input
                      type="number"
                      value={editForm.experienceYears}
                      onChange={(e) => setEditForm({...editForm, experienceYears: parseInt(e.target.value) || 0})}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="input-label">Minimum Consultation Fees</label>
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
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">Bio</label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                      className="form-input"
                      style={{ minHeight: '100px', resize: 'vertical' }}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                  <button type="button" onClick={() => setEditingProfile(false)} className="btn btn-secondary">Cancel</button>
                </div>
              </form>
            ) : (
              <div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                  gap: '1.25rem', 
                  marginBottom: '2rem' 
                }}>
                  <div style={{ 
                    backgroundColor: 'var(--pk-bg)', 
                    padding: '1.25rem', 
                    borderRadius: '12px',
                    border: '1px solid var(--pk-border)'
                  }}>
                    <p className="text-sm text-muted" style={{ marginBottom: '0.375rem' }}>Name</p>
                    <p style={{ fontWeight: 600, margin: 0 }}>Dr. {profile?.name}</p>
                  </div>
                  <div style={{ 
                    backgroundColor: 'var(--pk-bg)', 
                    padding: '1.25rem', 
                    borderRadius: '12px',
                    border: '1px solid var(--pk-border)'
                  }}>
                    <p className="text-sm text-muted" style={{ marginBottom: '0.375rem' }}>Specialization</p>
                    <p style={{ fontWeight: 600, margin: 0 }}>{profile?.specialization}</p>
                  </div>
                  <div style={{ 
                    backgroundColor: 'var(--pk-bg)', 
                    padding: '1.25rem', 
                    borderRadius: '12px',
                    border: '1px solid var(--pk-border)'
                  }}>
                    <p className="text-sm text-muted" style={{ marginBottom: '0.375rem' }}>Clinic</p>
                    <p style={{ fontWeight: 600, margin: 0 }}>{profile?.clinicName}</p>
                  </div>
                  {profile?.qualification && (
                    <div style={{ 
                      backgroundColor: 'var(--pk-bg)', 
                      padding: '1.25rem', 
                      borderRadius: '12px',
                      border: '1px solid var(--pk-border)'
                    }}>
                      <p className="text-sm text-muted" style={{ marginBottom: '0.375rem' }}>Qualification</p>
                      <p style={{ fontWeight: 600, margin: 0 }}>{profile.qualification}</p>
                    </div>
                  )}
                  {profile?.experienceYears > 0 && (
                    <div style={{ 
                      backgroundColor: 'var(--pk-bg)', 
                      padding: '1.25rem', 
                      borderRadius: '12px',
                      border: '1px solid var(--pk-border)'
                    }}>
                      <p className="text-sm text-muted" style={{ marginBottom: '0.375rem' }}>Experience</p>
                      <p style={{ fontWeight: 600, margin: 0 }}>{profile.experienceYears} years</p>
                    </div>
                  )}
                  <div style={{ 
                    backgroundColor: 'var(--pk-bg)', 
                    padding: '1.25rem', 
                    borderRadius: '12px',
                    border: '1px solid var(--pk-border)'
                  }}>
                    <p className="text-sm text-muted" style={{ marginBottom: '0.375rem' }}>Minimum Fees</p>
                    <p style={{ fontWeight: 600, margin: 0 }}>${profile?.minimumFees || 'Not set'}</p>
                  </div>
                  <div style={{ 
                    backgroundColor: 'var(--pk-bg)', 
                    padding: '1.25rem', 
                    borderRadius: '12px',
                    border: '1px solid var(--pk-border)'
                  }}>
                    <p className="text-sm text-muted" style={{ marginBottom: '0.375rem' }}>Status</p>
                    <p style={{ fontWeight: 600, margin: 0 }}>
                      {profile?.verified ? <span className="badge badge-success">Verified</span> : <span className="badge badge-danger">Pending</span>}
                    </p>
                  </div>
                </div>
                
                {profile?.bio && (
                  <div style={{ 
                    padding: '1.5rem', 
                    backgroundColor: 'var(--pk-bg)', 
                    borderRadius: '12px',
                    border: '1px solid var(--pk-border)'
                  }}>
                    <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>Bio</p>
                    <p style={{ margin: 0, lineHeight: 1.7 }}>{profile.bio}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
