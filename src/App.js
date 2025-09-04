// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Booking from './pages/Booking';
import Dashboard from './pages/Dashboard';
import AdminDashboard from "./pages/AdminDashboard";
import CompanyRegistration from "./pages/Company";
import CostReport from "./pages/CostReport";
import PendingUsers from "./pages/PendingUsers";
import Feedback from "./pages/Feedback";
import AdminFeedback from './pages/AdminFeedback';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/companies" element={<CompanyRegistration />} />
        <Route path="/cost-report" element={<CostReport />} />
        <Route path="/pending-users" element={<PendingUsers />} />
        <Route path="/feedback" element={<Feedback />} />
        <Route path="/admin-feedback" element={<AdminFeedback />} /> 
      </Routes>
    </Router>
  );
}

export default App;
