import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import "./Booking.css";

function Booking() {
  const [myBooking, setMyBooking] = useState(null);
  const [arrivalTime, setArrivalTime] = useState("09:00");
  const [bookingDate, setBookingDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const decoded = jwtDecode(token);
      const userId = decoded.userId || decoded.sub;
      fetchUserDetails(userId, token);
    } catch (err) {
      console.error("Failed to decode token", err);
      setError("Invalid token. Please log in again.");
    }
  }, [token, navigate]);

  const fetchUserDetails = async (userId, token) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data);
      fetchBookings(response.data.userId);
    } catch (err) {
      console.error("Error fetching user details", err);
      setError("Failed to load user details");
    }
  };

  const fetchBookings = async (userId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/bookings/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const confirmed = response.data.find((b) => b.status === "Confirmed");
      setMyBooking(confirmed || null);
    } catch (err) {
      setMyBooking(null);
      setError("No bookings found");
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async () => {
    if (!user) {
      setError("User not loaded yet. Please wait.");
      return;
    }
    if (!bookingDate) {
      setError("Please select a booking date");
      return;
    }

    try {
      setError("");
      const payload = {
        userId: user.userId,
        companyId: user.companyId,
        arrivalTime,
        bookingDate,
      };
      await axios.post("/api/bookings", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBookings(user.userId);
    } catch (err) {
      setError(err.response?.data || "Booking failed");
    }
  };

  const cancelBooking = async (id) => {
    try {
      await axios.post(`/api/bookings/${id}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBookings(user.userId);
    } catch (err) {
      setError("Cancel failed");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="booking-container">
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>⬅ Back</button>
        <h2>My Booking</h2>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <p className="info-note">⚠ You cannot book for the same date.</p>
      <p className="info-note">⚠ You can only book for the next two days.</p>

      {loading ? (
        <p>Loading...</p>
      ) : myBooking ? (
        <div className="current-booking">
          <p>
            ✅ You have a booking: <br />
            <strong>Slot #{myBooking.slotNumber}</strong> on <strong>{myBooking.bookingDate}</strong> at <strong>{myBooking.arrivalTime}</strong>
          </p>
          <button className="cancel-btn" onClick={() => cancelBooking(myBooking.bookingId)}>Cancel Booking</button>
        </div>
      ) : (
        <div className="date-time-book-centered">
          <input
            type="date"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
          />
          <input
            type="time"
            value={arrivalTime}
            onChange={(e) => setArrivalTime(e.target.value)}
          />
          <button onClick={createBooking}>Book</button>
        </div>
      )}

      {/* Feedback button always visible */}
      <div className="feedback-btn-bottom-left">
        <button onClick={() => navigate("/feedback")}>💬 Feedback</button>
      </div>

      {error && <p className="error-msg">{error}</p>}
    </div>
  );
}

export default Booking;
