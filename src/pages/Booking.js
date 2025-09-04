import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import "./Booking.css";

function Booking() {
  const [myBooking, setMyBooking] = useState(null);
  const [arrivalTime, setArrivalTime] = useState("09:00");
  const [bookingDate, setBookingDate] = useState(""); // date picker value
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Decode user info from token
  let userId = null;
  let companyId = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      userId = decoded.userId || decoded.sub || null;
      companyId = decoded.companyId || null;
    } catch (err) {
      console.error("Failed to decode token", err);
    }
  }

  const fetchBookings = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const response = await axios.get(`/api/bookings/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const confirmed = response.data.find((b) => b.status === "Confirmed");
      setMyBooking(confirmed || null);
    } catch (err) {
      setMyBooking(null);
      setError("No Bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const createBooking = async () => {
    if (!userId) {
      setError("User not found in token. Please log in again.");
      return;
    }
    if (!bookingDate) {
      setError("Please select a booking date");
      return;
    }
    try {
      setError("");
      const payload = {
        userId,
        companyId,
        arrivalTime,
        bookingDate,
      };
      await axios.post("/api/bookings", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBookings(); // refresh current booking
    } catch (err) {
      setError(err.response?.data || "Booking failed");
    }
  };

  const cancelBooking = async (id) => {
    try {
      await axios.post(
        `/api/bookings/${id}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBookings();
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
      {/* Top bar */}
      <div className="top-bar">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ⬅ Back
        </button>
        <h2>My Booking</h2>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Feedback button aligned left */}
      <div className="feedback-section-left">
        <button className="feedback-btn" onClick={() => navigate("/feedback")}>
          💬 Give Feedback
        </button>
      </div>

      {/* Booking section */}
      {loading ? (
        <p>Loading...</p>
      ) : myBooking ? (
        <div className="current-booking">
          <p>
            ✅ You have a booking: <br />
            <strong>Slot #{myBooking.slotNumber}</strong> on{" "}
            <strong>{myBooking.bookingDate}</strong> at{" "}
            <strong>{myBooking.arrivalTime}</strong>
          </p>
          <button
            className="cancel-btn"
            onClick={() => cancelBooking(myBooking.bookingId)}
          >
            Cancel Booking
          </button>
        </div>
      ) : (
        <div className="date-time-book">
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

      {error && <p className="error-msg">{error}</p>}
    </div>
  );
}

export default Booking;
