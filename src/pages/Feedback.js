import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {jwtDecode} from "jwt-decode"; 
import "./Feedback.css"; 

const Feedback = () => {
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const token = localStorage.getItem("token");
  const navigate = useNavigate(); 

  // Decode userId from token
  let userId = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      userId = decoded.userId || decoded.sub || null; // depending on how you store it in JWT
    } catch (err) {
      console.error("Failed to decode token", err);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      alert("User not found. Please login again.");
      return;
    }

    try {
      await axios.post(
        "http://localhost:8080/api/feedback",
        { message, rating, userId }, // ✅ include userId here
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmitted(true);
      setMessage("");
      setRating(0);

      // Auto redirect back after success
      setTimeout(() => navigate("/booking"), 2000);
    } catch (err) {
      alert("Failed to submit feedback");
    }
  };

  // Close handler -> go back to booking page
  const handleClose = () => {
    navigate("/booking");
  };

  return (
    <div className="feedback-form">
      <button className="close-btn" onClick={handleClose}>
        ×
      </button>

      <h2>Feedback</h2>
      {submitted && <p className="success">Thank you for your feedback!</p>}

      <form onSubmit={handleSubmit}>
        <div className="rating">
          <label>Rating: </label>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`star ${star <= rating ? "selected" : ""}`}
              onClick={() => setRating(star)}
            >
              ★
            </span>
          ))}
        </div>

        <div>
          <label>Message:</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your feedback here..."
            required
          />
        </div>

        <button type="submit" className="submit-btn" disabled={!message || rating === 0}>
          Submit
        </button>
      </form>
    </div>
  );
};

export default Feedback;
