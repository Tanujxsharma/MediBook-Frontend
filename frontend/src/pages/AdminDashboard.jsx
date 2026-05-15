import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { fetchApi } from '../services/api';
import { getUserContext } from '../services/auth';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, Users, Stethoscope } from 'lucide-react';

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

  if (!user || loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--pk-bg)' }}>
      <Navbar />
      <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ 
            backgroundColor: 'rgba(59, 130, 246, 0.1)', 
            color: 'var(--pk-accent)',
            padding: '0.875rem',
            borderRadius: '12px'
          }}>
            <Shield size={32} />
          </div>
          <div>
            <h1 style={{ margin: 0 }}>Admin Portal</h1>
            <p className="text-muted" style={{ margin: 0 }}>Manage doctors and patients on the platform</p>
          </div>
        </div>

        {/* Stats Overview (optional, visual) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>Total Doctors</p>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{providers.length}</p>
              </div>
              <div style={{ 
                backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                color: 'var(--pk-accent)',
                padding: '1rem',
                borderRadius: '12px'
              }}>
                <Stethoscope size={24} />
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="text-sm text-muted" style={{ marginBottom: '0.5rem' }}>Total Patients</p>
                <p style={{ fontSize: '2rem', fontWeight: 700, margin: 0 }}>{patients.length}</p>
              </div>
              <div style={{ 
                backgroundColor: 'rgba(22, 163, 74, 0.1)', 
                color: 'var(--pk-success)',
                padding: '1rem',
                borderRadius: '12px'
              }}>
                <Users size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Doctor Management */}
        <div className="card" style={{ marginBottom: '2.5rem' }}>
          <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Stethoscope size={20} /> Doctor Management
          </h3>
          {providers.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--pk-bg)', borderBottom: '2px solid var(--pk-border)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Name</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Email</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Specialization</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Clinic</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Fees</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--pk-border)' }}>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>{p.name}</td>
                      <td style={{ padding: '1rem', color: 'var(--pk-text-muted)' }}>{p.email || 'Not available'}</td>
                      <td style={{ padding: '1rem', color: 'var(--pk-text-muted)' }}>{p.specialization}</td>
                      <td style={{ padding: '1rem', color: 'var(--pk-text-muted)' }}>{p.clinicName}</td>
                      <td style={{ padding: '1rem', color: 'var(--pk-text-muted)' }}>${p.minimumFees ?? 0}</td>
                      <td style={{ padding: '1rem' }}>
                        {p.verified ? (
                          <span className="badge badge-success">Verified</span>
                        ) : (
                          <span className="badge badge-danger">Unverified</span>
                        )}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        {p.verified ? (
                          <button onClick={() => unverifyProvider(p.id)} className="btn btn-outline btn-sm" style={{ color: 'var(--pk-danger)', borderColor: 'var(--pk-danger)' }}>
                            <XCircle size={16} style={{ marginRight: '0.375rem' }} /> Unverify
                          </button>
                        ) : (
                          <button onClick={() => verifyProvider(p.id)} className="btn btn-primary btn-sm">
                            <CheckCircle size={16} style={{ marginRight: '0.375rem' }} /> Verify
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <p className="text-muted" style={{ margin: 0 }}>No doctors found.</p>
            </div>
          )}
        </div>

        {/* Patient Details */}
        <div className="card">
          <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={20} /> Patient Details
          </h3>
          {patients.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--pk-bg)', borderBottom: '2px solid var(--pk-border)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Name</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Email</th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Login Type</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id} style={{ borderBottom: '1px solid var(--pk-border)' }}>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>{patient.name}</td>
                      <td style={{ padding: '1rem', color: 'var(--pk-text-muted)' }}>{patient.email}</td>
                      <td style={{ padding: '1rem', color: 'var(--pk-text-muted)' }}>{patient.provider}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <p className="text-muted" style={{ margin: 0 }}>No patients found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
