import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css"; // reuse CSS

function AdminFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // default: highest rating first
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8080/api/feedback", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFeedbacks(response.data);
    } catch (err) {
      setError("Failed to fetch feedbacks");
    } finally {
      setLoading(false);
    }
  };

  const sortFeedbacks = (order) => {
    setSortOrder(order);
    const sorted = [...feedbacks].sort((a, b) =>
      order === "asc" ? a.rating - b.rating : b.rating - a.rating
    );
    setFeedbacks(sorted);
  };

  return (
    <div className="admin-dashboard">
      <h2>User Feedbacks</h2>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : feedbacks.length === 0 ? (
        <p>No feedback available</p>
      ) : (
        <>
          <div style={{ marginBottom: "15px" }}>
            <label>Sort by Rating: </label>
            <select
              value={sortOrder}
              onChange={(e) => sortFeedbacks(e.target.value)}
            >
              <option value="desc">Highest First</option>
              <option value="asc">Lowest First</option>
            </select>
          </div>

          <table className="bookings-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Rating</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {feedbacks.map((f) => (
                <tr key={f.feedbackId}>
                  <td>{f.userId}</td>
                  <td>{f.rating}</td>
                  <td>{f.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div style={{ marginTop: "20px" }}>
        <button className="back-button" onClick={() => navigate("/dashboard")}>
          ← Back to Admin Dashboard
        </button>
      </div>
    </div>
  );
}

export default AdminFeedback;
