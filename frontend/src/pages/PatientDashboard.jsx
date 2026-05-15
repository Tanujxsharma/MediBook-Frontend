import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { fetchApi } from '../services/api';
import { getUserContext } from '../services/auth';
import { Calendar as CalendarIcon, X, User, Search, Clock, MapPin, CheckCircle, CreditCard, Plus, Activity, Stethoscope, Users, Archive } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PatientDashboard = () => {
  const currentUser = getUserContext();
  const [appointments, setAppointments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingReason, setBookingReason] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [profile, setProfile] = useState({ name: 'Loading...', email: currentUser?.email || 'Loading...' });
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '' });
  const [showPayment, setShowPayment] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentError, setPaymentError] = useState('');
  const [tempAppointmentData, setTempAppointmentData] = useState(null);
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
      const dateA = a.startTime ? new Date(a.startTime) : new Date(0);
      const dateB = b.startTime ? new Date(b.startTime) : new Date(0);
      return dateA - dateB;
    });
  };

  const isSlotExpired = (slot) => {
    if (!slot?.endTime) return false;
    return new Date(slot.endTime) < new Date();
  };

  const isAppointmentCanceled = (appt) => {
    return appt.status?.toUpperCase() === 'CANCELLED' || appt.status?.toUpperCase() === 'CANCELED';
  };

  useEffect(() => {
    const user = getUserContext();
    if (!user || user.role !== 'PATIENT') {
       navigate('/login');
       return;
    }
    loadData();
  }, [navigate]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadSlotsOnly();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const applyProfileData = (profileData) => {
    const nextProfile = {
      id: profileData?.id || '',
      name: profileData?.name || currentUser?.name || 'Patient',
      email: profileData?.email || currentUser?.email || ''
    };
    setProfile(nextProfile);
    setEditForm({
      name: nextProfile.name,
      email: nextProfile.email
    });
  };

  const loadCurrentProfile = async () => {
    try {
      const profileData = await fetchApi('/users/me');
      applyProfileData(profileData);
      return profileData;
    } catch (e) {
      console.error('Failed to load profile:', e);
      const fallbackProfile = {
        name: currentUser?.name || 'Patient',
        email: currentUser?.email || ''
      };
      applyProfileData(fallbackProfile);
      return fallbackProfile;
    }
  };

  useEffect(() => {
    loadCurrentProfile();
  }, []);

  const loadSlotsOnly = async () => {
    try {
      const url = searchTerm ? `/slots/public?search=${encodeURIComponent(searchTerm)}` : '/slots/public';
      const slotsData = await fetchApi(url);
      setAvailableSlots(slotsData || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const url = searchTerm ? `/slots/public?search=${encodeURIComponent(searchTerm)}` : '/slots/public';
      
      const results = await Promise.allSettled([
        fetchApi('/appointments/my'),
        fetchApi(url),
        fetchApi('/users/me').catch(() => null)
      ]);
      
      const apptData = results[0].status === 'fulfilled' ? results[0].value : [];
      const slotsData = results[1].status === 'fulfilled' ? results[1].value : [];
      const profData = results[2].status === 'fulfilled' ? results[2].value : null;
      
      console.log('Profile data received:', profData);
      
      setAppointments(sortAppointmentsByDate(apptData || []));
      setAvailableSlots(sortSlots(slotsData || []));
      
      if (profData && (profData.name || profData.email)) {
        applyProfileData(profData);
      } else {
        applyProfileData({
          name: currentUser?.name || 'Patient',
          email: currentUser?.email || ''
        });
      }
    } catch (e) {
      console.error('Error loading dashboard data:', e);
      applyProfileData({
        name: currentUser?.name || 'Patient',
        email: currentUser?.email || ''
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (id) => {
    try {
      if(window.confirm('Are you sure you want to cancel?')) {
         await fetchApi(`/appointments/${id}/cancel`, { method: 'PUT' });
         loadData();
      }
    } catch (e) {
       alert(e.message || "Failed to cancel");
    }
  };

  const startEditProfile = () => {
    setEditForm({ 
      name: profile?.name || '', 
      email: profile?.email || '' 
    });
    setEditingProfile(true);
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      console.log('Sending profile update:', editForm);
      const updated = await fetchApi('/users/me', {
        method: 'PUT',
        body: JSON.stringify(editForm),
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('Profile update response:', updated);
      if (updated) {
        applyProfileData(updated);
        setEditingProfile(false);
        alert("Profile updated successfully!");
      }
    } catch (e) {
      console.error('Profile update error:', e);
      const errorMsg = e.message || "Failed to update profile";
      if (errorMsg.includes("401") || errorMsg.includes("Unauthorized")) {
        alert("Your session has expired. Please login again.");
      } else if (errorMsg.includes("already")) {
        alert("This email is already registered. Please use a different email.");
      } else {
        alert("Error: " + errorMsg);
      }
    }
  };

  const bookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedSlot) return;
    
    setTempAppointmentData({
      slotId: selectedSlot.id,
      notes: bookingReason,
      amount: selectedSlot.minimumFees || 0
    });
    setPaymentStatus(null);
    setPaymentError('');
    setShowPayment(true);
  };

  const processAppointmentPayment = async () => {
    if (!tempAppointmentData) return;
    
    setPaymentProcessing(true);
    setPaymentStatus(null);
    setPaymentError('');
    
    try {
      const appointmentRes = await fetchApi(`/appointments/book/${tempAppointmentData.slotId}`, {
        method: 'POST',
        body: JSON.stringify({ notes: tempAppointmentData.notes })
      });

      const appointmentId = appointmentRes.id;
      const paymentRes = await fetchApi('/payments/process', {
        method: 'POST',
        body: JSON.stringify({
          appointmentId: appointmentId,
          userId: currentUser?.userId,
          providerId: selectedSlot.providerId,
          amount: tempAppointmentData.amount,
          paymentMethod: 'LOCAL',
          description: `Consultation with Dr. ${selectedSlot.doctorName || 'Provider'}`
        })
      });

      if (paymentRes?.status !== 'SUCCESS') {
        throw new Error('Payment could not be completed. Please try again.');
      }

      completePayment();
    } catch (e) {
      console.error('Appointment booking error:', e);
      setPaymentStatus('ERROR');
      const errorMsg = e.message || "Appointment booking failed";
      setPaymentError(errorMsg);
    } finally {
      setPaymentProcessing(false);
    }
  };

  const completePayment = () => {
    setPaymentStatus('SUCCESS');
    alert("Payment successful! Your slot has been booked!");
    setShowPayment(false);
    setSelectedSlot(null);
    setBookingReason('');
    setTempAppointmentData(null);
    loadData();
  };

  const closePaymentModal = () => {
    if (paymentProcessing) return;
    setShowPayment(false);
    setTempAppointmentData(null);
    setPaymentError('');
    setPaymentStatus(null);
  };

  const stats = [
    { 
      icon: <CalendarIcon size={24} />, 
      label: 'Upcoming', 
      value: appointments.filter(a => !isAppointmentCanceled(a)).length,
      color: 'var(--pk-accent)'
    },
    { 
      icon: <Stethoscope size={24} />, 
      label: 'Available Slots', 
      value: sortSlots(availableSlots.filter(s => !s.booked && !s.isBooked && !isSlotExpired(s))).length,
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
          <h1>Patient Portal</h1>
          <p>Welcome back, {profile?.name}! Manage your appointments and book new ones</p>
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
            <CalendarIcon size={18} /> Upcoming
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
            onClick={() => setActiveTab('book')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'book' ? 'var(--pk-accent)' : 'transparent',
              color: activeTab === 'book' ? 'white' : 'var(--pk-text-main)',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Plus size={18} /> Book Appointment
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
            <User size={18} /> My Profile
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'appointments' && (
          <div className="card">
            <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <CalendarIcon size={20} /> Upcoming Appointments
            </div>
            {appointments.filter(a => !isAppointmentCanceled(a)).length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
                {appointments.filter(a => !isAppointmentCanceled(a)).map(appt => (
                   <div key={appt.id} className="card" style={{ padding: '1.5rem', margin: 0 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                         <div style={{ 
                           width: '44px', 
                           height: '44px', 
                           borderRadius: '50%', 
                           backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                           display: 'flex', 
                           alignItems: 'center', 
                           justifyContent: 'center',
                           color: 'var(--pk-accent)'
                         }}>
                           <CalendarIcon size={20} />
                         </div>
                         <div>
                           <div style={{ fontWeight: 600 }}>
                             {appt.slotStartTime ? new Date(appt.slotStartTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : `Slot #${appt.slotId}`}
                             </div>
                             {appt.slotStartTime && (
                               <div className="text-sm text-muted">
                                 {new Date(appt.slotStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                 {appt.slotEndTime && ` – ${new Date(appt.slotEndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                               </div>
                             )}
                           </div>
                         </div>
                         <span className="badge badge-success">{appt.status}</span>
                       </div>
                       
                       {appt.notes && (
                         <div style={{ 
                           backgroundColor: 'var(--pk-bg)', 
                           padding: '0.875rem', 
                           borderRadius: '8px',
                           marginBottom: '1rem'
                         }}>
                           <p className="text-sm" style={{ margin: 0 }}>
                             <strong>Notes:</strong> {appt.notes}
                           </p>
                         </div>
                       )}
                       
                       <div style={{ textAlign: 'right' }}>
                         {appt.status !== 'CANCELLED' && (
                           <button 
                            onClick={() => cancelAppointment(appt.id)} 
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--pk-danger)', borderColor: 'var(--pk-danger)' }}
                          >
                             Cancel
                           </button>
                         )}
                       </div>
                     </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <CalendarIcon size={48} style={{ color: 'var(--pk-text-muted)', marginBottom: '1rem' }} />
                <p className="text-muted" style={{ margin: 0 }}>You have no upcoming appointments.</p>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1rem' }}>
                {appointments.filter(a => isAppointmentCanceled(a)).map(appt => (
                   <div key={appt.id} className="card" style={{ padding: '1.5rem', margin: 0, opacity: 0.8 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                         <div style={{ 
                           width: '44px', 
                           height: '44px', 
                           borderRadius: '50%', 
                           backgroundColor: 'rgba(220, 38, 38, 0.1)', 
                           display: 'flex', 
                           alignItems: 'center', 
                           justifyContent: 'center',
                           color: 'var(--pk-danger)'
                         }}>
                           <CalendarIcon size={20} />
                         </div>
                         <div>
                           <div style={{ fontWeight: 600 }}>
                             {appt.slotStartTime ? new Date(appt.slotStartTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : `Slot #${appt.slotId}`}
                             </div>
                             {appt.slotStartTime && (
                               <div className="text-sm text-muted">
                                 {new Date(appt.slotStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                 {appt.slotEndTime && ` – ${new Date(appt.slotEndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                               </div>
                             )}
                           </div>
                         </div>
                         <span className="badge badge-danger">{appt.status}</span>
                       </div>
                       
                       {appt.notes && (
                         <div style={{ 
                           backgroundColor: 'var(--pk-bg)', 
                           padding: '0.875rem', 
                           borderRadius: '8px',
                           marginBottom: '1rem'
                         }}>
                           <p className="text-sm" style={{ margin: 0 }}>
                             <strong>Notes:</strong> {appt.notes}
                           </p>
                         </div>
                       )}
                     </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <Archive size={48} style={{ color: 'var(--pk-text-muted)', marginBottom: '1rem' }} />
                <p className="text-muted" style={{ margin: 0 }}>You have no canceled appointments.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'book' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            
            {/* Left: Book New Appointment */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 className="section-title" style={{ margin: 0 }}>Available Slots</h3>
                
                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                  <Search size={18} style={{ 
                    position: 'absolute', 
                    left: '1rem', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: 'var(--pk-text-muted)'
                  }} />
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Search by doctor, specialty..." 
                    style={{ paddingLeft: '3rem' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {availableSlots.length > 0 ? (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', paddingRight: '0.5rem', flex: 1 }}>
                      {sortSlots(availableSlots.filter(s => !s.booked && !s.isBooked && !isSlotExpired(s))).map(slot => (
                         <div 
                          key={slot.id} 
                          className="card" 
                          style={{ 
                            padding: '1.25rem', 
                            margin: 0, 
                            cursor: 'pointer', 
                            border: selectedSlot?.id === slot.id ? '2px solid var(--pk-accent)' : '1px solid var(--pk-border)',
                            backgroundColor: selectedSlot?.id === slot.id ? 'rgba(59, 130, 246, 0.05)' : 'var(--pk-surface)',
                            flexShrink: 0,
                            transition: 'all 0.2s'
                          }} 
                          onClick={() => setSelectedSlot(slot)}
                        >
                           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                             <div>
                               <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--pk-text-main)' }}>
                                 Dr. {slot.doctorName || `Provider #${slot.providerId}`}
                               </div>
                               <div className="text-muted text-sm">{slot.specialization}</div>
                               <div className="text-muted text-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.5rem' }}>
                                 <MapPin size={14} /> {slot.clinicName}
                               </div>
                             </div>
                             <div style={{ textAlign: 'right' }}>
                               <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                                 {new Date(slot.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                               </div>
                               <div className="text-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--pk-text-muted)' }}>
                                 <Clock size={14} />
                                 {new Date(slot.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} – {new Date(slot.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                               </div>
                             </div>
                           </div>
                         </div>
                      ))}
                   </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                    <p className="text-muted">No open slots at the moment.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Confirm Booking */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedSlot ? (
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                     <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Confirm Booking</h3>
                     <button 
                      onClick={() => setSelectedSlot(null)} 
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.5rem', minWidth: 'auto' }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div style={{ 
                    backgroundColor: 'var(--pk-bg)', 
                    padding: '1.25rem', 
                    borderRadius: '12px',
                    border: '1px solid var(--pk-border)',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.25rem' }}>
                      Dr. {selectedSlot.doctorName || `Provider #${selectedSlot.providerId}`}
                    </div>
                    <p className="text-muted" style={{ margin: 0 }}>{selectedSlot.specialization}</p>
                    <p className="text-muted" style={{ margin: '0.25rem 0 0 0' }}>{selectedSlot.clinicName}</p>
                    
                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--pk-border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <CalendarIcon size={16} style={{ color: 'var(--pk-accent)' }} />
                        <span style={{ fontWeight: 500 }}>
                          {new Date(selectedSlot.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={16} style={{ color: 'var(--pk-accent)' }} />
                        <span>
                          {new Date(selectedSlot.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} – {new Date(selectedSlot.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={bookAppointment}>
                     <div className="input-group">
                       <label className="input-label">Reason for visit</label>
                       <textarea 
                         required 
                         value={bookingReason} 
                         onChange={(e) => setBookingReason(e.target.value)}
                         className="input-field" 
                         style={{ minHeight: '100px', resize: 'vertical' }}
                         placeholder="Please briefly describe your symptoms or reason for visit."
                       />
                     </div>
                     <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '1rem' }}>
                       <CheckCircle size={18} /> Confirm Booking
                     </button>
                  </form>
                </div>
              ) : (
                <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <CalendarIcon size={48} style={{ color: 'var(--pk-text-muted)', marginBottom: '1rem' }} />
                    <p className="text-muted" style={{ margin: 0 }}>Select a slot to confirm your booking</p>
                  </div>
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
                  <User size={32} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.5rem', margin: 0 }}>My Profile</h2>
                  <p className="text-muted" style={{ margin: '0.25rem 0 0 0' }}>{profile?.email}</p>
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
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="input-label">Email Address</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                  <button type="button" onClick={() => setEditingProfile(false)} className="btn btn-secondary">Cancel</button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.25rem' }}>
                <div style={{ 
                  backgroundColor: 'var(--pk-bg)', 
                  padding: '1.25rem', 
                  borderRadius: '12px',
                  border: '1px solid var(--pk-border)'
                }}>
                  <p className="text-sm text-muted" style={{ marginBottom: '0.375rem' }}>Full Name</p>
                  <p style={{ fontWeight: 600, margin: 0 }}>{profile?.name || 'Loading...'}</p>
                </div>
                <div style={{ 
                  backgroundColor: 'var(--pk-bg)', 
                  padding: '1.25rem', 
                  borderRadius: '12px',
                  border: '1px solid var(--pk-border)'
                }}>
                  <p className="text-sm text-muted" style={{ marginBottom: '0.375rem' }}>Email Address</p>
                  <p style={{ fontWeight: 600, margin: 0 }}>{profile?.email || 'Loading...'}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Modal */}
        {showPayment && tempAppointmentData && (
          <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0, 0, 0, 0.5)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 1000,
            padding: '1.5rem'
          }}>
            <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                    color: 'var(--pk-accent)',
                    padding: '0.75rem',
                    borderRadius: '12px'
                  }}>
                    <CreditCard size={24} />
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Complete Payment</h2>
                </div>
                {!paymentProcessing && (
                  <button onClick={closePaymentModal} className="btn btn-secondary btn-sm">
                    <X size={18} />
                  </button>
                )}
              </div>

              <div style={{ 
                backgroundColor: 'var(--pk-bg)', 
                padding: '1.25rem', 
                borderRadius: '12px',
                marginBottom: '1.5rem',
                border: '1px solid var(--pk-border)'
              }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span className="text-sm text-muted">Doctor</span>
                  <p style={{ fontWeight: 600, margin: 0 }}>Dr. {selectedSlot?.doctorName || 'Provider'}</p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--pk-border)', marginTop: '0.75rem' }}>
                  <span style={{ fontWeight: 500 }}>Amount</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--pk-accent)' }}>
                    ₹{tempAppointmentData.amount.toFixed(2)}
                  </span>
                </div>
              </div>

              {paymentStatus === 'SUCCESS' && (
                <div style={{ 
                  backgroundColor: 'rgba(22, 163, 74, 0.1)', 
                  color: 'var(--pk-success)', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  marginBottom: '1rem', 
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <CheckCircle size={20} />
                  Payment Successful!
                </div>
              )}
              
              {paymentStatus === 'ERROR' && (
                <div style={{ 
                  backgroundColor: 'rgba(220, 38, 38, 0.1)', 
                  color: 'var(--pk-danger)', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  marginBottom: '1rem', 
                  textAlign: 'center',
                  fontWeight: 500
                }}>
                  {paymentError || 'Unable to start payment. Please try again.'}
                </div>
              )}

              <button
                onClick={processAppointmentPayment}
                disabled={paymentProcessing}
                className="btn btn-primary"
                style={{ width: '100%', fontSize: '1rem' }}
              >
                {paymentProcessing ? 'Processing...' : 'Complete Payment'}
              </button>
              
              {!paymentProcessing && (
                <button 
                  onClick={closePaymentModal} 
                  className="btn btn-secondary" 
                  style={{ width: '100%', marginTop: '0.75rem' }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
