import React from "react";
import { useNavigate } from "react-router-dom";
import "./Company.css";

const ReportDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="company-container">
      <h2>Reports Dashboard</h2>
      <p>Select a report type to view:</p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          marginTop: "20px",
          maxWidth: "300px",
        }}
      >
        <button
          onClick={() => navigate("/reports/cost")}
          style={{ padding: "10px 20px", cursor: "pointer" }}
        >
          📊 Projected Cost Report
        </button>

        <button
          onClick={() => navigate("/reports/usage")}
          style={{ padding: "10px 20px", cursor: "pointer" }}
        >
          📈 Usage Report
        </button>

        <button
          className="back-button"
          onClick={() => navigate("/dashboard")}
          style={{ padding: "10px 20px", cursor: "pointer" }}
        >
          ← Go to Main Dashboard
        </button>
      </div>
    </div>
  );
};

export default ReportDashboard;
