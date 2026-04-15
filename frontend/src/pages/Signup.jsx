import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchApi } from '../services/api';
import Navbar from '../components/Navbar';
import { UserPlus } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    password: '',
    role: 'PATIENT',
    specialization: '',
    clinicName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await fetchApi('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      navigate('/login?registered=true');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="container" style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', backgroundColor: 'var(--pk-primary)', color: 'white', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
              <UserPlus size={32} />
            </div>
            <h2>Create Account</h2>
            <p className="text-muted text-sm">Join MediBook today</p>
          </div>
          
          {error && <div className="badge badge-danger mb-4" style={{ display: 'block', textAlign: 'center' }}>{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">I am a...</label>
              <select name="role" value={formData.role} onChange={handleChange} className="input-field" required>
                <option value="PATIENT">Patient seeking doctors</option>
                <option value="DOCTOR">Doctor offering appointments</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input type="text" name="fullname" value={formData.fullname} onChange={handleChange} className="input-field" required />
            </div>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" required />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field" required minLength={6} />
            </div>

            {formData.role === 'DOCTOR' && (
              <>
                <div className="input-group">
                  <label className="input-label">Specialization</label>
                  <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} className="input-field" required />
                </div>
                <div className="input-group">
                  <label className="input-label">Clinic Name</label>
                  <input type="text" name="clinicName" value={formData.clinicName} onChange={handleChange} className="input-field" required />
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Creating...' : 'Sign Up'}
            </button>
            
            <p className="text-center text-muted" style={{ marginTop: '1.5rem', fontSize: '0.875rem' }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--pk-primary)', fontWeight: '500' }}>Log In</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
