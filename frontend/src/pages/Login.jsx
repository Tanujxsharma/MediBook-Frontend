import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { fetchApi } from '../services/api';
import { setAuthToken, getUserContext } from '../services/auth';
import Navbar from '../components/Navbar';
import { LogIn } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const registered = queryParams.get('registered');

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = getUserContext();
    if (user) {
       navigate(user.role === 'DOCTOR' ? '/doctor' : (user.role === 'ADMIN' ? '/admin' : '/patient'));
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      if (response && response.token) {
          setAuthToken(response.token);
          const user = getUserContext();
          if (user) {
              navigate(user.role === 'DOCTOR' ? '/doctor' : (user.role === 'ADMIN' ? '/admin' : '/patient'));
          } else {
              navigate('/');
          }
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password');
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
               <LogIn size={32} />
            </div>
            <h2>Welcome Back</h2>
            <p className="text-muted text-sm">Please log in to your account</p>
          </div>
          
          {registered && <div className="badge badge-success mb-4" style={{ display: 'block', textAlign: 'center' }}>Account created! Please log in.</div>}
          {error && <div className="badge badge-danger mb-4" style={{ display: 'block', textAlign: 'center' }}>{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="input-field" required />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="input-field" required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Logging in...' : 'Log In'}
            </button>
            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                <a href="http://localhost:8080/oauth2/authorization/google" className="btn btn-outline" style={{width: '100%'}}>Sign In with Google</a>
            </div>
            
            <p className="text-center text-muted" style={{ marginTop: '1.5rem', fontSize: '0.875rem' }}>
              Don't have an account? <Link to="/signup" style={{ color: 'var(--pk-primary)', fontWeight: '500' }}>Sign Up</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
