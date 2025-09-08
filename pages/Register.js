import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Register.css';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    vehicleNumber: '',
    role: '',
    employerId: '',
    companyId: ''
  });

  const [companies, setCompanies] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch companies on mount
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/companies');
        setCompanies(res.data);
      } catch (err) {
        console.error('Failed to fetch companies', err);
        setError('Failed to load companies');
        setTimeout(() => setError(''), 3000);
      }
    };
    fetchCompanies();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    const re = /^[0-9]{10}$/;
    return re.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mandatory fields check
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.role ||
      !formData.companyId ||
      !formData.phoneNumber ||
      !formData.vehicleNumber ||
      !formData.employerId
    ) {
      setError('Please fill all mandatory fields.');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!validatePhone(formData.phoneNumber)) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    try {
      await axios.post('http://localhost:8080/api/users/register', formData);
      setMessage('Registration successful! Redirecting to login...');
      setError('');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || 'Registration failed');
      setMessage('');
      setTimeout(() => setError(''), 4000);
    }
  };

  return (
    <div className="container">
      <h2>User Registration</h2>

      {error && <p className="error-message">{error}</p>}
      {message && <p className="success-message">{message}</p>}

      <form onSubmit={handleSubmit} className="form">
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="phoneNumber"
          placeholder="Phone Number"
          value={formData.phoneNumber}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="employerId"
          placeholder="Employer ID"
          value={formData.employerId}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="vehicleNumber"
          placeholder="Vehicle Number"
          value={formData.vehicleNumber}
          onChange={handleChange}
          required
        />

        <select name="role" value={formData.role} onChange={handleChange} required>
          <option value="">Select Role</option>
          <option value="User">User</option>
          <option value="Admin">Admin</option>
        </select>

        <select name="companyId" value={formData.companyId} onChange={handleChange} required>
          <option value="">Select Company</option>
          {companies.map(company => (
            <option key={company.companyId} value={company.companyId}>
              {company.companyName}
            </option>
          ))}
        </select>

        <button type="submit">Register</button>
      </form>

      <button className="back-button" onClick={() => navigate('/')}>
        ← Back
      </button>
    </div>
  );
};

export default Register;
