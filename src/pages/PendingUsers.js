import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './PendingUser.css';
import { useNavigate } from 'react-router-dom';

const PendingUsers = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState(null); // "approve" or "reject"
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/users/pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPendingUsers(response.data);
    } catch (err) {
      console.error('Error fetching pending users', err);
    }
  };

  const confirmAction = (u, type) => {
    setSelectedUser({ userId: u.userId ?? u.id, name: u.name });
    setActionType(type);
    setModalOpen(true);
  };

  const handleAction = async () => {
    if (!selectedUser || !actionType) return;
    try {
      const token = localStorage.getItem('token');
      const endpoint =
        actionType === 'approve'
          ? `http://localhost:8080/api/users/${selectedUser.userId}/approve`
          : `http://localhost:8080/api/users/${selectedUser.userId}/reject`;

      await axios.patch(endpoint, {}, { headers: { Authorization: `Bearer ${token}` } });

      setPendingUsers(prev => prev.filter(u => (u.userId ?? u.id) !== selectedUser.userId));

      setMessage(
        `User ${selectedUser.name} ${actionType === 'approve' ? 'approved' : 'rejected'} successfully.`
      );
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(`Error during ${actionType}`, err);
      setMessage(`Failed to ${actionType} user.`);
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setModalOpen(false);
      setSelectedUser(null);
      setActionType(null);
    }
  };

  return (
    <div className="pending-users-container" style={{ position: 'relative', paddingBottom: '60px' }}>
      <h1>Pending Users</h1>

      {message && <div className="top-message">{message}</div>}

      {pendingUsers.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Employer ID</th>
              <th>Company ID</th>
              <th>Vehicle Number</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map((u) => {
              const id = u.userId ?? u.id;
              return (
                <tr key={id}>
                  <td>{id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.employerId}</td>
                  <td>{u.companyId}</td>
                  <td>{u.vehicleNumber}</td>
                  <td>{u.phoneNumber}</td>
                  <td>{u.registrationStatus}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="approve-btn"
                        onClick={() => confirmAction(u, 'approve')}
                      >
                        Approve
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => confirmAction(u, 'reject')}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p>No pending users.</p>
      )}

      {modalOpen && selectedUser && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">
          <div className="modal">
            <h3 id="confirmTitle">
              Confirm {actionType === 'approve' ? 'Approval' : 'Rejection'}
            </h3>
            <p>Are you sure you want to {actionType} the user:</p>
            <p className="modal-username">
              <strong>{selectedUser.name}</strong> (ID: {selectedUser.userId})
            </p>
            <div className="modal-actions">
              <button
                className={actionType === 'approve' ? 'approve-btn' : 'reject-btn'}
                onClick={handleAction}
              >
                Confirm
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setModalOpen(false);
                  setSelectedUser(null);
                  setActionType(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Back button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="back-button"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: '#fff',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
        }}
      >
        ← Back to Dashboard
      </button>
    </div>
  );
};

export default PendingUsers;
