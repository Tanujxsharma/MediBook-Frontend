import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { fetchApi } from '../services/api';
import { getUserContext } from '../services/auth';
import { Calendar as CalendarIcon, X } from 'lucide-react';
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
  const [tempAppointmentData, setTempAppointmentData] = useState(null);
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
      return dateB - dateA;
    });
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
      
      // Use Promise.allSettled to handle any endpoint failures gracefully
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
    
    // First, store the appointment data and show payment modal
    setTempAppointmentData({
      slotId: selectedSlot.id,
      notes: bookingReason,
      amount: selectedSlot.minimumFees || 0
    });
    setShowPayment(true);
  };

  const processPayment = async () => {
    if (!tempAppointmentData) return;
    
    setPaymentProcessing(true);
    setPaymentStatus(null);
    
    try {
      // Create temporary appointment first to get appointment ID
      const appointmentRes = await fetchApi(`/appointments/book/${tempAppointmentData.slotId}`, {
        method: 'POST',
        body: JSON.stringify({ notes: tempAppointmentData.notes })
      });

      const appointmentId = appointmentRes.id;
      let appointmentBooked = true;
      
      // Process payment with proper error handling
      try {
        const paymentRes = await fetchApi('/payments/process', {
          method: 'POST',
          body: JSON.stringify({
            appointmentId: appointmentId,
            userId: currentUser?.userId,
            providerId: selectedSlot.providerId,
            amount: tempAppointmentData.amount,
            paymentMethod: 'DEMO',
            description: `Consultation with Dr. ${selectedSlot.doctorName}`
          })
        });

        if (paymentRes && (paymentRes.status === 'SUCCESS' || paymentRes.statusCode === 200 || paymentRes.statusCode === 201)) {
          setPaymentStatus('SUCCESS');
          alert("Payment successful! Your slot has been booked!");
        } else {
          setPaymentStatus('FAILED');
          alert("Payment failed but your slot has been booked successfully!");
          appointmentBooked = true;
        }
      } catch (paymentError) {
        console.error('Payment processing error:', paymentError);
        setPaymentStatus('FAILED');
        alert("Payment failed but your slot has been booked successfully!");
        appointmentBooked = true;
      }

      // Only clear and reload if payment went through or slot was booked
      if (appointmentBooked) {
        setShowPayment(false);
        setSelectedSlot(null);
        setBookingReason('');
        setTempAppointmentData(null);
        loadData();
      }
    } catch (e) {
      console.error('Appointment booking error:', e);
      setPaymentStatus('ERROR');
      const errorMsg = e.message || "Appointment booking failed";
      alert("Error: " + errorMsg);
    } finally {
      setPaymentProcessing(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--pk-bg)' }}>
      <Navbar />

      <div className="container" style={{ padding: '2rem 1rem' }}>
        <h1 className="mb-6">Patient Portal</h1>
        
        {/* Profile Section */}
        <div className="card mb-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>My Profile</h2>
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
                  <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="form-input"
                    required
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
              <p><strong>Name:</strong> {profile?.name || 'Loading...'}</p>
              <p><strong>Email:</strong> {profile?.email || 'Loading...'}</p>
            </div>
          )}
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          
          {/* Left: Book New Appointment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>Available Slots</h2>
              </div>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Search by doctor, specialty..." 
                style={{ marginBottom: '1rem' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {availableSlots.length > 0 ? (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '0.5rem', flex: 1 }}>
                    {sortSlots(availableSlots.filter(s => !s.booked && !s.isBooked)).map(slot => (
                       <div key={slot.id} className="card" style={{ padding: '1rem', margin: 0, cursor: 'pointer', transition: 'all 0.2s', border: selectedSlot?.id === slot.id ? '2px solid var(--pk-primary)' : '1px solid var(--pk-border)', backgroundColor: selectedSlot?.id === slot.id ? 'rgba(37, 99, 235, 0.05)' : 'var(--pk-surface)', flexShrink: 0 }} onClick={() => setSelectedSlot(slot)}>
                         <div style={{ fontWeight: '600', marginBottom: '0.25rem', color: 'var(--pk-primary)' }}>Dr. {slot.doctorName || `Provider #${slot.providerId}`}</div>
                         <div className="text-muted" style={{ fontSize: '0.8rem' }}>{slot.specialization}</div>
                         <div className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>{slot.clinicName}</div>
                         <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>{new Date(slot.startTime).toLocaleDateString()}</div>
                         <div style={{ fontSize: '0.875rem' }}>{new Date(slot.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} – {new Date(slot.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                       </div>
                    ))}
                 </div>
              ) : (
                <p className="text-muted">No open slots at the moment.</p>
              )}
            </div>
          </div>

          {/* Right: Confirm Booking */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {selectedSlot ? (
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                   <h3 style={{ margin: 0 }}>Confirm Booking</h3>
                   <button onClick={() => setSelectedSlot(null)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }}><X size={20} /></button>
                </div>
                 <div style={{ marginBottom: '1rem', fontSize: '0.9rem', backgroundColor: 'var(--pk-accent)', padding: '0.75rem', borderRadius: 'var(--pk-radius-sm)' }}>
                    <p style={{ margin: 0, fontWeight: '600' }}>Dr. {selectedSlot.doctorName || `Provider #${selectedSlot.providerId}`}</p>
                    <p style={{ margin: '0.25rem 0', color: 'var(--pk-text-muted)' }}>{selectedSlot.specialization} · {selectedSlot.clinicName}</p>
                    <p style={{ margin: '0.5rem 0 0 0' }}>Date: {new Date(selectedSlot.startTime).toLocaleDateString()}</p>
                    <p style={{ margin: 0 }}>Time: {new Date(selectedSlot.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} – {new Date(selectedSlot.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                 </div>

                <form onSubmit={bookAppointment}>
                   <div className="input-group">
                     <label className="input-label">Reason for visit</label>
                     <textarea 
                       required 
                       value={bookingReason} 
                       onChange={(e) => setBookingReason(e.target.value)}
                       className="input-field" 
                       style={{ minHeight: '80px', resize: 'vertical' }}
                       placeholder="Please briefly describe your symptoms or reason for visit."
                     />
                   </div>
                   <button type="submit" className="btn btn-primary mt-2" style={{ width: '100%' }}>Confirm Booking</button>
                </form>
              </div>
            ) : (
              <div className="card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <p className="text-muted" style={{ margin: 0, textAlign: 'center' }}>Select a slot to confirm your booking</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom: My Appointments */}
        <div className="card" style={{ marginTop: '2rem' }}>
          <h2 className="mb-4">My Appointments</h2>
          {appointments.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {appointments.map(appt => (
                 <div key={appt.id} className="card" style={{ padding: '1rem', margin: 0 }}>
                   <div>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                       <CalendarIcon size={18} style={{ color: 'var(--pk-primary)' }} />
                       <strong style={{ fontSize: '1.1rem' }}>
                         {appt.slotStartTime ? new Date(appt.slotStartTime).toLocaleDateString() : `Slot #${appt.slotId}`}
                       </strong>
                     </div>
                     {appt.slotStartTime && (
                       <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem' }}>
                         Time: {new Date(appt.slotStartTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                         {appt.slotEndTime && ` – ${new Date(appt.slotEndTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                       </p>
                     )}
                     <p className="text-muted" style={{ margin: 0, fontSize: '0.95rem' }}>Notes: {appt.notes || '—'}</p>
                   </div>
                   <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                     <span className={`badge ${appt.status === 'CANCELLED' ? 'badge-danger' : 'badge-success'}`}>{appt.status}</span>
                     {appt.status !== 'CANCELLED' && (
                       <button onClick={() => cancelAppointment(appt.id)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: 'var(--pk-danger)', borderColor: 'var(--pk-danger)' }}>
                         Cancel
                       </button>
                     )}
                   </div>
                 </div>
              ))}
            </div>
          ) : (
            <p className="text-muted">You have no upcoming appointments.</p>
          )}
        </div>

        {/* Payment Modal */}
        {showPayment && tempAppointmentData && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ maxWidth: '500px', width: '90%', padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ margin: 0 }}>Complete Payment</h2>
                <button onClick={() => { setShowPayment(false); setTempAppointmentData(null); }} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem' }}><X size={20} /></button>
              </div>

              <div style={{ backgroundColor: 'var(--pk-accent)', padding: '1rem', borderRadius: 'var(--pk-radius-sm)', marginBottom: '1.5rem' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                  <strong>Doctor:</strong> Dr. {selectedSlot?.doctorName || 'Provider'}<br/>
                  <strong>Amount:</strong> ${tempAppointmentData.amount.toFixed(2)}<br/>
                  <strong>Payment Method:</strong> Demo (Test Mode)
                </p>
              </div>

              {paymentStatus === 'SUCCESS' && (
                <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '1rem', borderRadius: 'var(--pk-radius-sm)', marginBottom: '1rem', textAlign: 'center' }}>
                  Payment Successful!
                </div>
              )}
              {paymentStatus === 'FAILED' && (
                <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '1rem', borderRadius: 'var(--pk-radius-sm)', marginBottom: '1rem', textAlign: 'center' }}>
                  Payment Failed. Please try again.
                </div>
              )}

              <button 
                onClick={processPayment} 
                disabled={paymentProcessing} 
                className="btn btn-primary" 
                style={{ width: '100%' }}
              >
                {paymentProcessing ? 'Processing...' : 'Pay Now'}
              </button>
              <button 
                onClick={() => { setShowPayment(false); setTempAppointmentData(null); }} 
                className="btn btn-outline" 
                style={{ width: '100%', marginTop: '0.5rem' }}
                disabled={paymentProcessing}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
