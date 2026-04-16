import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { fetchApi } from '../services/api';
import { getUserContext } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, XCircle } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [providers, setProviders] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getUserContext();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    loadProviders();
  }, [navigate]);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const [providerData, patientData] = await Promise.allSettled([
        fetchApi('/providers/admin/all'),
        fetchApi('/users/admin/patients')
      ]);

      setProviders(providerData.status === 'fulfilled' ? (providerData.value || []) : []);
      setPatients(patientData.status === 'fulfilled' ? (patientData.value || []) : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const verifyProvider = async (id) => {
    try {
      await fetchApi(`/providers/${id}/verify`, { method: 'PUT' });
      loadProviders();
    } catch (e) {
      alert("Failed to verify: " + e.message);
    }
  };

  const unverifyProvider = async (id) => {
    try {
      await fetchApi(`/providers/${id}/unverify`, { method: 'PUT' });
      loadProviders();
    } catch (e) {
      alert("Failed to unverify: " + e.message);
    }
  };

  if (!user || loading) return <div>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--pk-bg)' }}>
      <Navbar />
      <div className="container" style={{ padding: '2rem 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <Shield size={32} style={{ color: 'var(--pk-primary)' }} />
          <h1 style={{ margin: 0 }}>Admin Portal</h1>
        </div>

        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 className="mb-4">Doctor Management</h2>
          {providers.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--pk-border)' }}>
                    <th style={{ padding: '0.75rem' }}>Name</th>
                    <th style={{ padding: '0.75rem' }}>Email</th>
                    <th style={{ padding: '0.75rem' }}>Specialization</th>
                    <th style={{ padding: '0.75rem' }}>Clinic</th>
                    <th style={{ padding: '0.75rem' }}>Fees</th>
                    <th style={{ padding: '0.75rem' }}>Status</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--pk-border)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '500' }}>{p.name}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--pk-text-muted)' }}>{p.email || 'Not available'}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--pk-text-muted)' }}>{p.specialization}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--pk-text-muted)' }}>{p.clinicName}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--pk-text-muted)' }}>${p.minimumFees ?? 0}</td>
                      <td style={{ padding: '0.75rem' }}>
                        {p.verified ? (
                          <span className="badge badge-success">Verified</span>
                        ) : (
                          <span className="badge badge-danger">Unverified</span>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        {p.verified ? (
                          <button onClick={() => unverifyProvider(p.id)} className="btn btn-outline" style={{ display: 'inline-flex', padding: '0.25rem 0.5rem', fontSize: '0.875rem', color: 'var(--pk-danger)', borderColor: 'var(--pk-danger)' }}>
                            <XCircle size={16} style={{ marginRight: '0.25rem' }} /> Unverify
                          </button>
                        ) : (
                          <button onClick={() => verifyProvider(p.id)} className="btn btn-primary" style={{ display: 'inline-flex', padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>
                            <CheckCircle size={16} style={{ marginRight: '0.25rem' }} /> Verify
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted">No doctors found.</p>
          )}
        </div>

        <div className="card">
          <h2 className="mb-4">Patient Details</h2>
          {patients.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--pk-border)' }}>
                    <th style={{ padding: '0.75rem' }}>Name</th>
                    <th style={{ padding: '0.75rem' }}>Email</th>
                    <th style={{ padding: '0.75rem' }}>Login Type</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id} style={{ borderBottom: '1px solid var(--pk-border)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: '500' }}>{patient.name}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--pk-text-muted)' }}>{patient.email}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--pk-text-muted)' }}>{patient.provider}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-muted">No patients found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
