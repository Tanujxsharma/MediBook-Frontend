import { Link, useNavigate } from 'react-router-dom';
import { getUserContext, removeAuthToken } from '../services/auth';
import { Stethoscope, Calendar, LogIn, User, LogOut } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  const user = getUserContext();

  const handleLogout = () => {
    removeAuthToken();
    navigate('/');
  };

  return (
    <nav style={{ backgroundColor: 'var(--pk-surface)', borderBottom: '1px solid var(--pk-border)', padding: '1rem', position: 'sticky', top: 0, zIndex: 50 }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--pk-primary)' }}>
          <Stethoscope size={24} />
          MediBook
        </Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {user ? (
            <>
              {user.role === 'DOCTOR' && (
                <Link to="/doctor" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Calendar size={18} /> Doctor Portal
                </Link>
              )}
              {user.role === 'PATIENT' && (
                <Link to="/patient" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <User size={18} /> My Appointments
                </Link>
              )}
              {user.role === 'ADMIN' && (
                <Link to="/admin" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <User size={18} /> Admin Portal
                </Link>
              )}
              <div style={{ borderLeft: '1px solid var(--pk-border)', height: '24px' }}></div>
              <button className="btn btn-outline" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.75rem' }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <LogIn size={18} /> Login
              </Link>
              <Link to="/signup" className="btn btn-primary">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
