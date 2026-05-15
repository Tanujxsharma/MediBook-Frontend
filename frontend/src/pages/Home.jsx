import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { fetchApi } from '../services/api';
import { Search, Clock, MapPin, Stethoscope, CalendarCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const [providers, setProviders] = useState([]);
  const [slots, setSlots] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProviders();
    fetchPublicSlots();
  }, []);

  const fetchProviders = async () => {
    try {
      const res = await fetchApi('/providers');
      setProviders(res || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPublicSlots = async () => {
    try {
      const res = await fetchApi('/slots/public');
      setSlots(res || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (searchTerm) {
        const res = await fetchApi(`/providers/search?keyword=${searchTerm}`);
        setProviders(res || []);
      } else {
        fetchProviders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />
      
      {/* Hero Section with Search */}
      <section style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
        color: 'white', 
        padding: '4rem 1.5rem 5rem', 
        textAlign: 'center' 
      }}>
        <div className="container">
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h1 style={{ 
              color: 'white', 
              fontSize: '2.5rem', 
              marginBottom: '1rem',
              fontWeight: 700
            }}>
              Find & Book the Best Doctors
            </h1>
            <p style={{ 
              fontSize: '1.125rem', 
              marginBottom: '2rem', 
              opacity: 0.9,
              lineHeight: 1.7
            }}>
              Connect with verified healthcare professionals and book appointments hassle-free.
            </p>
            
            <form onSubmit={handleSearch} style={{ 
              maxWidth: '600px', 
              margin: '0 auto', 
              display: 'flex', 
              gap: '0.75rem',
              backgroundColor: 'white',
              padding: '0.5rem',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              <input 
                type="text" 
                placeholder="Search by name, specialization or clinic..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  flexGrow: 1, 
                  padding: '0.875rem 1.25rem', 
                  fontSize: '1rem',
                  border: 'none',
                  borderRadius: '8px',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
              <button 
                type="submit" 
                style={{ 
                  backgroundColor: '#3b82f6', 
                  color: 'white', 
                  padding: '0.875rem 2rem',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }} 
                disabled={loading}
              >
                <Search size={20} /> 
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <div className="container" style={{ padding: '3rem 1.5rem 4rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Available Doctors</h2>
            <p className="text-muted" style={{ margin: '0.5rem 0 0 0' }}>Browse and connect with our network of healthcare professionals</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.75rem 1.25rem', 
              backgroundColor: 'white', 
              borderRadius: '8px', 
              border: '1px solid var(--pk-border)',
              boxShadow: 'var(--pk-shadow-sm)'
            }}>
              <Stethoscope size={18} style={{ color: 'var(--pk-accent)' }} />
              <span style={{ fontWeight: 600 }}>{providers.length} Doctors</span>
            </div>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {providers.length > 0 ? providers.map(provider => {
            const availableSlotsCount = slots.filter(s => s.providerId === provider.id && !s.booked && !s.isBooked).length;
            return (
              <div key={provider.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ 
                      width: '56px', 
                      height: '56px', 
                      borderRadius: '50%', 
                      backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: 'var(--pk-accent)',
                      flexShrink: 0
                    }}>
                      <Stethoscope size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Dr. {provider.name || 'Doctor'}</h3>
                      <p className="text-muted" style={{ margin: '0.25rem 0 0 0' }}>{provider.specialization}</p>
                    </div>
                  </div>
                  {provider.available ? (
                     <span className="badge badge-success">Available</span>
                  ) : (
                     <span className="badge badge-danger">Unavailable</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: '#64748b' }}>
                  <MapPin size={16} />
                  <span className="text-sm"><strong>Clinic:</strong> {provider.clinicName}</span>
                </div>
                
                <div style={{ 
                  marginTop: '1.25rem', 
                  paddingTop: '1.25rem', 
                  borderTop: '1px solid var(--pk-border)' 
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <h4 style={{ fontSize: '0.95rem', margin: 0, fontWeight: 600 }}>Available Slots</h4>
                    <span className="text-sm" style={{ color: availableSlotsCount > 0 ? 'var(--pk-success)' : 'var(--pk-text-muted)' }}>
                      {availableSlotsCount > 0 ? `${availableSlotsCount} slots` : 'No slots'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    {availableSlotsCount > 0 ? (
                      slots.filter(s => s.providerId === provider.id && !s.booked && !s.isBooked).slice(0, 3).map(slot => (
                        <div 
                          key={slot.id} 
                          style={{ 
                            backgroundColor: 'var(--pk-bg)', 
                            padding: '0.625rem 0.875rem', 
                            borderRadius: '8px', 
                            fontSize: '0.8rem',
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '0.25rem',
                            border: '1px solid var(--pk-border)'
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>
                            {new Date(slot.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--pk-text-muted)' }}>
                            <Clock size={12} /> {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted text-sm">No available slots</p>
                    )}
                  </div>
                  <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
                    Book Appointment
                  </Link>
                </div>
              </div>
            );
          }) : (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 2rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <Stethoscope size={48} style={{ color: 'var(--pk-text-muted)', margin: '0 auto' }} />
              </div>
              <p className="text-muted" style={{ fontSize: '1.125rem', margin: 0 }}>No doctors found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
