import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchApi } from '../services/api';
import Navbar from '../components/Navbar';
import { UserPlus, User, Mail, Lock, ArrowRight, Stethoscope, Users, CalendarCheck, Heart } from 'lucide-react';

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

  const features = [
    {
      icon: <Users size={20} />,
      title: 'Easy Registration',
      description: 'Sign up in minutes with simple steps'
    },
    {
      icon: <CalendarCheck size={20} />,
      title: '24/7 Booking',
      description: 'Book appointments anytime, anywhere'
    },
    {
      icon: <Heart size={20} />,
      title: 'Trusted Care',
      description: 'Connect with verified healthcare providers'
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
                Start Your <br />Health Journey
              </h1>
              <p style={{ 
                fontSize: '1.125rem', 
                opacity: 0.9, 
                lineHeight: 1.7,
                marginBottom: '2.5rem'
              }}>
                Whether you're a patient seeking care or a doctor providing services, MediBook offers a seamless experience for everyone.
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
          <div style={{ maxWidth: '460px', width: '100%' }}>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ 
                display: 'inline-flex', 
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
                color: 'white', 
                padding: '1rem', 
                borderRadius: '12px', 
                marginBottom: '1.25rem',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
              }}>
                <UserPlus size={28} />
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Create Account
              </h1>
              <p className="text-muted">
                Join MediBook today and take control of your healthcare
              </p>
            </div>
            
            <div className="card" style={{ padding: '2rem' }}>
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
                  <label className="input-label">I am a...</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'PATIENT' })}
                      style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        border: formData.role === 'PATIENT' 
                          ? '2px solid var(--pk-accent)' 
                          : '2px solid var(--pk-border)',
                        backgroundColor: formData.role === 'PATIENT' 
                          ? 'rgba(59, 130, 246, 0.05)' 
                          : 'var(--pk-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        alignItems: 'center'
                      }}
                    >
                      <User size={24} style={{ color: formData.role === 'PATIENT' ? 'var(--pk-accent)' : 'var(--pk-text-muted)' }} />
                      <span style={{ fontWeight: formData.role === 'PATIENT' ? 600 : 500 }}>Patient</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'DOCTOR' })}
                      style={{
                        padding: '1rem',
                        borderRadius: '8px',
                        border: formData.role === 'DOCTOR' 
                          ? '2px solid var(--pk-accent)' 
                          : '2px solid var(--pk-border)',
                        backgroundColor: formData.role === 'DOCTOR' 
                          ? 'rgba(59, 130, 246, 0.05)' 
                          : 'var(--pk-surface)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                        alignItems: 'center'
                      }}
                    >
                      <Stethoscope size={24} style={{ color: formData.role === 'DOCTOR' ? 'var(--pk-accent)' : 'var(--pk-text-muted)' }} />
                      <span style={{ fontWeight: formData.role === 'DOCTOR' ? 600 : 500 }}>Doctor</span>
                    </button>
                  </div>
                </div>
                
                <div className="input-group">
                  <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={16} />
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    name="fullname" 
                    value={formData.fullname} 
                    onChange={handleChange} 
                    className="input-field" 
                    required 
                    placeholder="John Doe"
                  />
                </div>
                
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
                    minLength={6} 
                    placeholder="•••••••• (min. 6 characters)"
                  />
                </div>

                {formData.role === 'DOCTOR' && (
                  <>
                    <div className="input-group">
                      <label className="input-label">Specialization</label>
                      <input 
                        type="text" 
                        name="specialization" 
                        value={formData.specialization} 
                        onChange={handleChange} 
                        className="input-field" 
                        required 
                        placeholder="Cardiology, Pediatrics, etc."
                      />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Clinic Name</label>
                      <input 
                        type="text" 
                        name="clinicName" 
                        value={formData.clinicName} 
                        onChange={handleChange} 
                        className="input-field" 
                        required 
                        placeholder="City Medical Center"
                      />
                    </div>
                  </>
                )}

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '0.5rem', fontSize: '1rem' }} 
                  disabled={loading}
                >
                  {loading ? 'Creating account...' : 'Sign Up'}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            </div>
            
            <p className="text-center" style={{ marginTop: '2rem', color: 'var(--pk-text-muted)', fontSize: '0.95rem' }}>
              Already have an account? <Link to="/login" style={{ color: 'var(--pk-accent)', fontWeight: 600, marginLeft: '0.25rem' }}>Log In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
