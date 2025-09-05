import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchBookings();
  }, []);

  // Fetch only today's Confirmed bookings that haven't exited
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8080/api/bookings/confirmed", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const now = new Date();

      const todaysBookings = response.data.filter((b) => {
        if (b.status !== "Confirmed" || b.hasLeft) return false;

        const bookingDate = new Date(b.bookingDate);
        return (
          bookingDate.getFullYear() === now.getFullYear() &&
          bookingDate.getMonth() === now.getMonth() &&
          bookingDate.getDate() === now.getDate()
        );
      });

      setBookings(todaysBookings);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  };

  // Mark arrival
  const markArrival = async (id) => {
    try {
      await axios.put(
        `http://localhost:8080/api/bookings/${id}/arrived`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBookings((prev) =>
        prev.map((b) => (b.bookingId === id ? { ...b, hasArrived: true } : b))
      );
    } catch (err) {
      console.error(err);
      setError("Failed to update arrival status");
    }
  };

  // Mark exit
  const markExit = async (id) => {
    try {
      await axios.put(
        `http://localhost:8080/api/bookings/${id}/exit`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setBookings((prev) => prev.filter((b) => b.bookingId !== id));
    } catch (err) {
      console.error(err);
      setError("Failed to update exit status");
    }
  };

  // Highlight overdue bookings (current time past arrivalTime but not yet arrived)
  const isOverdue = (b) => {
    if (b.hasArrived) return false;
    const now = new Date();
    const bookingDateTime = new Date(`${b.bookingDate}T${b.arrivalTime}`);
    return now > bookingDateTime;
  };

  return (
    <div className="admin-dashboard">
      <h2>Today's Bookings</h2>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : bookings.length === 0 ? (
        <p>No active bookings for today</p>
      ) : (
        <table className="bookings-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>User ID</th>
              <th>Slot</th>
              <th>Date</th>
              <th>Arrival</th>
              <th>Status</th>
              <th>Mark Arrival</th>
              <th>Mark Exit</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.bookingId} className={isOverdue(b) ? "overdue" : ""}>
                <td>{b.bookingId}</td>
                <td>{b.userId}</td>
                <td>{b.slotNumber}</td>
                <td>{b.bookingDate}</td>
                <td>{b.arrivalTime}</td>
                <td>{b.status}</td>
                <td>
                  {!b.hasArrived ? (
                    <button
                      className="arrived-btn"
                      onClick={() => markArrival(b.bookingId)}
                    >
                      Mark Arrived
                    </button>
                  ) : (
                    <span>Arrived</span>
                  )}
                </td>
                <td>
                  {b.hasArrived && !b.hasLeft ? (
                    <button
                      className="exit-btn"
                      onClick={() => markExit(b.bookingId)}
                    >
                      Mark Exit
                    </button>
                  ) : b.hasLeft ? (
                    <span>Exited</span>
                  ) : (
                    <span>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Back to Dashboard Button */}
      <div style={{ marginTop: "20px" }}>
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default AdminDashboard;
