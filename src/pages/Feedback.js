import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./Feedback.css";

const Feedback = () => {
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const maxMessageLength = 300;

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Decode userId from token
  let userId = null;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      userId = decoded.userId || decoded.sub || null;
    } catch (err) {
      console.error("Failed to decode token", err);
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!userId) {
      alert("User not found. Please login again.");
      return;
    }

    if (rating === 0) {
      setError("Rating is required.");
      return;
    }

    if (message.trim().length === 0) {
      setError("Feedback message is required.");
      return;
    }

    try {
      await axios.post(
        "http://localhost:8080/api/feedback",
        { message, rating, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSubmitted(true);
      setMessage("");
      setRating(0);
      setError("");

      // Redirect to booking after success
      setTimeout(() => navigate("/booking"), 2000);
    } catch (err) {
      alert("Failed to submit feedback");
    }
  };

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
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit}>
        <div className="rating">
          <label>Rating: </label>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`star ${star <= rating ? "selected" : ""}`}
              onClick={() => {
                setRating(star);
                setError(""); // clear error on select
              }}
            >
              ★
            </span>
          ))}
        </div>

        <div>
          <label>Message:</label>
          <textarea
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              setError(""); // clear error on type
            }}
            placeholder="Write your feedback here..."
            required
            maxLength={maxMessageLength}
          />
          <div className="char-count">
            {message.length}/{maxMessageLength} characters
          </div>
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={rating === 0 || message.trim().length === 0}
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default Feedback;
