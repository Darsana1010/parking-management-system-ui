import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [companies, setCompanies] = useState([]); // List of all companies
  const [pendingUsers, setPendingUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); 
  const [editingUser, setEditingUser] = useState(false); 
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    vehicleNumber: '',
    employerId: '',
    companyId: ''
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    try {
      const decoded = jwtDecode(token);
      const userId = decoded.id || decoded.userId;
      if (!userId) throw new Error("No user ID in token");

      fetchUserDetails(userId, token);
      fetchCompanies(token); // fetch all company names

      if (decoded.role === 'Admin') {
        fetchPendingUsers(token);
      }
    } catch (err) {
      console.error('Invalid token', err);
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);

  const fetchUserDetails = async (userId, token) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
    } catch (err) { console.error('Error fetching user details', err); }
  };

  const fetchCompanies = async (token) => {
    try {
      const res = await axios.get('http://localhost:8080/api/companies', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCompanies(res.data); // assume each company has {id, name}
    } catch (err) { console.error('Error fetching companies', err); }
  };

  const fetchPendingUsers = async (token) => {
    try {
      const response = await axios.get('http://localhost:8080/api/users/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingUsers(response.data);
    } catch (err) { console.error('Error fetching pending users', err); }
  };

  const confirmApprove = (u) => {
    setSelectedUser({ userId: u.userId ?? u.id, name: u.name });
    setModalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedUser) return;
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`http://localhost:8080/api/users/${selectedUser.userId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingUsers(prev => prev.filter(u => (u.userId ?? u.id) !== selectedUser.userId));
      setMessage(`User ${selectedUser.name} approved successfully.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error approving user', err);
      setMessage('Failed to approve user.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setModalOpen(false);
      setSelectedUser(null);
    }
  };

  const startEditUser = () => {
    if (!user) return;
    setEditingUser(true);
    setEditFormData({
      name: user.name || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      vehicleNumber: user.vehicleNumber || '',
      employerId: user.employerId || '',
      companyId: user.companyId || ''
    });
  };

  const handleEditChange = (e) => {
    setEditFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const saveUserUpdate = async () => {
    const { name, email, phoneNumber, vehicleNumber, employerId, companyId } = editFormData;
    if (!name || !email || !phoneNumber || !vehicleNumber || !employerId || !companyId) {
      setError('All fields are mandatory.');
      setTimeout(() => setError(''), 3000);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`http://localhost:8080/api/users/${user.userId ?? user.id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      setMessage('User updated successfully.');
      setTimeout(() => setMessage(''), 3000);
      setEditingUser(false);
    } catch (err) {
      console.error('Error updating user', err);
      setError('Failed to update user.');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <button onClick={handleLogout} className="logout-button">Logout</button>
      {message && <div className="top-message success">{message}</div>}
      {error && <div className="top-message error">{error}</div>}

      {user && (
        <>
          <h1>Welcome, {user.name}</h1>
          <div className="user-card">
            {!editingUser ? (
              <>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Phone:</strong> {user.phoneNumber}</p>
                {user.role !== 'Admin' && <p><strong>Vehicle Number:</strong> {user.vehicleNumber}</p>}
                <p><strong>Employer ID:</strong> {user.employerId}</p>
                <p><strong>Company:</strong> {companies.find(c => c.companyId === user.companyId)?.companyName || 'N/A'}</p>
                {user.role !== 'Admin' && <p><strong>Status:</strong> {user.registrationStatus}</p>}
                <button className="edit-btn" onClick={startEditUser}>Edit Info</button>
              </>
            ) : (
              <div className="edit-form">
                <input name="name" value={editFormData.name} onChange={handleEditChange} placeholder="Full Name" />
                <input name="email" value={editFormData.email} onChange={handleEditChange} placeholder="Email" />
                <input name="phoneNumber" value={editFormData.phoneNumber} onChange={handleEditChange} placeholder="Phone" />
                <input name="vehicleNumber" value={editFormData.vehicleNumber} onChange={handleEditChange} placeholder="Vehicle Number" />
                <input name="employerId" value={editFormData.employerId} onChange={handleEditChange} placeholder="Employer ID" />
                
                <select name="companyId" value={editFormData.companyId} onChange={handleEditChange}>
                  <option value="">Select Company</option>
                  {companies.map(c => (
                    <option key={c.companyId} value={c.companyId}>{c.companyName}</option>
                  ))}
                </select>

                <div className="form-actions">
                  <button onClick={saveUserUpdate}>Save</button>
                  <button onClick={() => setEditingUser(false)}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          {user.role === 'Admin' && (
            <div className="admin-actions">
              <button className="admin-btn" onClick={() => navigate('/admin-dashboard')}disabled={user.registrationStatus !== 'Approved'}>View All Bookings</button>
                  <button className="admin-btn" onClick={() => navigate('/pending-users')}disabled={user.registrationStatus !== 'Approved'}>Pending Users</button>
              <button className="admin-btn" onClick={() => navigate('/companies')} disabled={user.registrationStatus !== 'Approved'}>Manage Companies</button>
              <button className="admin-btn" onClick={() => navigate("/admin-feedback")} disabled={user.registrationStatus !== 'Approved'}>View Feedbacks</button>
               <button className="admin-btn" onClick={() => navigate('/reports')}disabled={user.registrationStatus !== 'Approved'}>View Reports</button>

                   {user.registrationStatus !== 'Approved' && (
      <p className="not-approved-message">
        ⚠️ Your admin account is not approved yet. Admin features are disabled.
      </p>
    )}
            </div>
          )}

          {user.role !== 'Admin' && (
            <div className="actions">
              <button
                onClick={() => navigate('/booking')}
                disabled={user.registrationStatus === 'Pending'}
                className={`booking-button ${user.registrationStatus === 'Pending' ? 'disabled' : ''}`}
              >
                Go to Booking
              </button>
              {user.registrationStatus === 'Pending' && (
                <p className="pending-message">You can proceed to booking once approved.</p>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {modalOpen && selectedUser && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">
          <div className="modal">
            <h3 id="confirmTitle">Confirm Approval</h3>
            <p>Are you sure you want to approve the user:</p>
            <p className="modal-username"><strong>{selectedUser.name}</strong> (ID: {selectedUser.userId})</p>
            <div className="modal-actions">
              <button className="confirm-btn" onClick={handleApprove}>Confirm</button>
              <button className="cancel-btn" onClick={() => { setModalOpen(false); setSelectedUser(null); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
