import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { setAuthToken, getUserContext } from '../services/auth';

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get('token');

    if (token) {
      setAuthToken(token);
      const user = getUserContext();
      if (user) {
        navigate(user.role === 'DOCTOR' ? '/doctor' : '/patient');
      } else {
        navigate('/');
      }
    } else {
      navigate('/login?error=oauth_failed');
    }
  }, [navigate, location]);

  return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <p>Authenticating...</p>
    </div>
  );
};

export default OAuthSuccess;
