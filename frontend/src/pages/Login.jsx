import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { fetchApi } from '../services/api';
import { setAuthToken, getUserContext } from '../services/auth';
import Navbar from '../components/Navbar';
import { LogIn, Mail, Lock, ArrowRight, CheckCircle, Stethoscope, Users, CalendarCheck } from 'lucide-react';

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

  const features = [
    {
      icon: <Stethoscope size={20} />,
      title: 'Find Top Doctors',
      description: 'Connect with verified healthcare professionals'
    },
    {
      icon: <CalendarCheck size={20} />,
      title: 'Book Instantly',
      description: 'Schedule appointments in seconds'
    },
    {
      icon: <Users size={20} />,
      title: 'Trusted Platform',
      description: 'Join thousands of satisfied patients'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      
      <div className="auth-split">
        {/* Left Side - Hero Content */}
        <div className="auth-hero-side">
          {/* Decorative elements */}
          <div className="decorative-circle large"></div>
          <div className="decorative-circle small"></div>

          <div style={{ maxWidth: '500px', position: 'relative', zIndex: 1 }}>
            <div style={{ marginBottom: '2.5rem' }}>
              <h1 style={{ 
                fontSize: '2.75rem', 
                fontWeight: 700, 
                lineHeight: 1.1,
                marginBottom: '1.25rem',
                color: 'white'
              }}>
                Your Health, <br />Your Priority
              </h1>
              <p style={{ 
                fontSize: '1.125rem', 
                opacity: 0.9, 
                lineHeight: 1.7,
                marginBottom: '2.5rem'
              }}>
                Join our healthcare platform and experience seamless doctor-patient connections with easy booking, secure payments, and professional care.
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="auth-feature-card"
                >
                  <div className="icon-wrapper">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.25rem', color: 'white' }}>
                      {feature.title}
                    </h3>
                    <p style={{ fontSize: '0.95rem', opacity: 0.8, margin: 0 }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="auth-form-side">
          <div style={{ maxWidth: '420px', width: '100%' }}>
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ 
                display: 'inline-flex', 
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
                color: 'white', 
                padding: '1rem', 
                borderRadius: '12px', 
                marginBottom: '1.25rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
              }}>
                 <LogIn size={28} />
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Welcome Back
              </h1>
              <p className="text-muted">
                Please log in to your account to continue
              </p>
            </div>
            
            <div className="card" style={{ padding: '2rem' }}>
              {registered && (
                <div style={{ 
                  backgroundColor: 'rgba(22, 163, 74, 0.1)', 
                  color: 'var(--pk-success)', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <CheckCircle size={20} />
                  <span style={{ fontWeight: 500 }}>Account created! Please log in.</span>
                </div>
              )}
              
              {error && (
                <div style={{ 
                  backgroundColor: 'rgba(220, 38, 38, 0.1)', 
                  color: 'var(--pk-danger)', 
                  padding: '1rem', 
                  borderRadius: '8px', 
                  marginBottom: '1.5rem',
                  fontWeight: 500
                }}>
                  {error}
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="input-group">
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={16} />
                    Email
                  </label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    className="input-field" 
                    required 
                    placeholder="you@example.com"
                  />
                </div>
                
                <div className="input-group">
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Lock size={16} />
                    Password
                  </label>
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    className="input-field" 
                    required 
                    placeholder="••••••••"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '0.5rem', fontSize: '1rem' }} 
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Log In'}
                  {!loading && <ArrowRight size={18} />}
                </button>
                
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '1.5rem',
                    color: 'var(--pk-text-muted)'
                  }}>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--pk-border)' }}></div>
                    <span style={{ padding: '0 1rem', fontSize: '0.875rem' }}>or continue with</span>
                    <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--pk-border)' }}></div>
                  </div>
                  <a 
                    href="http://localhost:8080/oauth2/authorization/google" 
                    className="btn btn-secondary" 
                    style={{ width: '100%' }}
                  >
                    <svg style={{ width: '20px', height: '20px' }} viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign In with Google
                  </a>
                </div>
              </form>
            </div>
            
            <p className="text-center" style={{ marginTop: '2rem', color: 'var(--pk-text-muted)', fontSize: '0.95rem' }}>
              Don't have an account? <Link to="/signup" style={{ color: 'var(--pk-accent)', fontWeight: 600, marginLeft: '0.25rem' }}>Sign Up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
