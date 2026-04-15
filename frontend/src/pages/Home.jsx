import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { fetchApi } from '../services/api';
import { Search, Clock } from 'lucide-react';
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
      
      {/* Hero Section */}
      <section style={{ backgroundColor: 'var(--pk-primary)', color: 'white', padding: '4rem 1rem', textAlign: 'center' }}>
        <div className="container">
          <h1 style={{ color: 'white', fontSize: '2.5rem', marginBottom: '1rem' }}>Find & Book the Best Doctors</h1>
          <p style={{ fontSize: '1.125rem', marginBottom: '2rem', opacity: 0.9 }}>Book appointments with top specialists hassle-free.</p>
          
          <form onSubmit={handleSearch} style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="Search by name, specialization or clinic..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field"
              style={{ flexGrow: 1, padding: '0.75rem 1rem', fontSize: '1rem' }}
            />
            <button type="submit" className="btn" style={{ backgroundColor: 'white', color: 'var(--pk-primary)', padding: '0 1.5rem' }} disabled={loading}>
              <Search size={20} /> Search
            </button>
          </form>
        </div>
      </section>

      <div className="container" style={{ padding: '3rem 1rem' }}>
        <h2 className="mb-6">Available Doctors</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {providers.length > 0 ? providers.map(provider => (
            <div key={provider.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Dr. {provider.name || 'Doctor'}</h3>
                  <p className="text-muted" style={{ margin: 0 }}>{provider.specialization}</p>
                </div>
                {provider.available ? (
                   <span className="badge badge-success">Available</span>
                ) : (
                   <span className="badge badge-danger">Unavailable</span>
                )}
              </div>
              <p style={{ fontSize: '0.875rem' }} className="mb-4"><strong>Clinic:</strong> {provider.clinicName}</p>
              
              <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Available Slots</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {slots.filter(s => s.providerId === provider.id && !s.booked && !s.isBooked).length > 0 ? (
                  <>
                    <div style={{ width: '100%', fontSize: '0.9rem', fontWeight: '600', color: 'var(--pk-success)' }}>
                      ✓ Slots Available ({slots.filter(s => s.providerId === provider.id && !s.booked && !s.isBooked).length})
                    </div>
                    {slots.filter(s => s.providerId === provider.id && !s.booked && !s.isBooked).slice(0, 3).map(slot => (
                      <div key={slot.id} style={{ border: '1px solid var(--pk-border)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', backgroundColor: 'var(--pk-accent)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ fontWeight: '600' }}>{new Date(slot.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={12} /> {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-muted" style={{ fontSize: '0.875rem' }}>No available slots</p>
                )}
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <Link to="/login" className="btn btn-outline" style={{ width: '100%' }}>Book Appointment</Link>
              </div>
            </div>
          )) : (
            <p className="text-muted">No doctors found matching your search.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
