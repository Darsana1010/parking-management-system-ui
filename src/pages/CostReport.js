import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./Company.css";

const CostReport = () => {
  const [companies, setCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const COST_PER_SLOT = 50;
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28CFD", "#FF6699"];

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchCompanies(token);
  }, [navigate]);

  const fetchCompanies = async (token) => {
    try {
      const response = await axios.get("http://localhost:8080/api/companies", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCompanies(response.data);
    } catch (err) {
      console.error("Error fetching companies", err);
    }
  };

  const chartData = companies.map(c => ({
    name: c.companyName,
    allocatedSlots: c.allocatedParkingSlots,
    monthlyCost: c.allocatedParkingSlots * COST_PER_SLOT * 30,
    yearlyCost: c.allocatedParkingSlots * COST_PER_SLOT * 365
  }));

  const filteredData = chartData.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // --- Full PDF (all companies) with table + pie chart + bar chart ---
  const downloadFullPDF = () => {
    const doc = new jsPDF("p", "pt", "a4");
    doc.setFontSize(16);
    doc.text("All Companies Cost Report", 20, 30);

    // Table
    const tableColumns = ["Company", "Allocated Slots", "Monthly Cost", "Yearly Cost"];
    const tableRows = filteredData.map(c => [
      c.name,
      c.allocatedSlots,
      c.monthlyCost,
      c.yearlyCost
    ]);

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 50,
      theme: "grid",
    });

    // --- Pie Chart for Yearly Cost ---
    const pieCanvas = document.createElement("canvas");
    pieCanvas.width = 600;
    pieCanvas.height = 400;
    const pieCtx = pieCanvas.getContext("2d");

    const pieData = filteredData.map(c => c.yearlyCost);
    const pieLabels = filteredData.map(c => c.name);
    const total = pieData.reduce((a, b) => a + b, 0);

    let startAngle = 0;
    pieData.forEach((value, index) => {
      const sliceAngle = (value / total) * 2 * Math.PI;
      pieCtx.beginPath();
      pieCtx.moveTo(300, 200);
      pieCtx.fillStyle = COLORS[index % COLORS.length];
      pieCtx.arc(300, 200, 150, startAngle, startAngle + sliceAngle);
      pieCtx.closePath();
      pieCtx.fill();
      startAngle += sliceAngle;
    });

    // Legend
    pieCtx.font = "14px Arial";
    pieLabels.forEach((label, index) => {
      pieCtx.fillStyle = COLORS[index % COLORS.length];
      pieCtx.fillRect(470, 50 + index * 25, 15, 15);
      pieCtx.fillStyle = "#000";
      pieCtx.fillText(label, 490, 63 + index * 25);
    });

    doc.addPage();
    doc.text("Yearly Cost Pie Chart", 20, 30);
    const pieImg = pieCanvas.toDataURL("image/png");
    doc.addImage(pieImg, "PNG", 20, 50, 550, 350);

    // --- Bar Chart for Monthly vs Yearly Cost ---
    const barCanvas = document.createElement("canvas");
    barCanvas.width = 600;
    barCanvas.height = 400;
    const barCtx = barCanvas.getContext("2d");

    const maxCost = Math.max(...filteredData.map(c => c.yearlyCost));
    const barWidth = 30;
    const gap = 20;
    let x = 50;

    // Axes
    barCtx.beginPath();
    barCtx.moveTo(40, 350);
    barCtx.lineTo(580, 350); // x-axis
    barCtx.moveTo(40, 350);
    barCtx.lineTo(40, 50); // y-axis
    barCtx.stroke();

    filteredData.forEach((c, index) => {
      // Monthly bar
      const monthlyHeight = (c.monthlyCost / maxCost) * 250;
      barCtx.fillStyle = COLORS[0];
      barCtx.fillRect(x, 350 - monthlyHeight, barWidth, monthlyHeight);

      // Yearly bar
      const yearlyHeight = (c.yearlyCost / maxCost) * 250;
      barCtx.fillStyle = COLORS[1];
      barCtx.fillRect(x + barWidth + 5, 350 - yearlyHeight, barWidth, yearlyHeight);

      // Labels
      barCtx.fillStyle = "#000";
      barCtx.font = "10px Arial";
      barCtx.fillText(c.name, x, 365);
      barCtx.fillText(Math.round(c.monthlyCost), x, 350 - monthlyHeight - 5);
      barCtx.fillText(Math.round(c.yearlyCost), x + barWidth + 5, 350 - yearlyHeight - 5);

      x += barWidth * 2 + 20;
    });

    doc.addPage();
    doc.text("Monthly vs Yearly Cost Bar Chart", 20, 30);
    const barImg = barCanvas.toDataURL("image/png");
    doc.addImage(barImg, "PNG", 20, 50, 550, 350);

    doc.save("All-Companies-Cost-Report.pdf");
  };

  // --- Individual company PDF (bar chart only) ---
  const downloadCompanyPDF = (companyName) => {
    const data = filteredData.find(c => c.name === companyName);
    if (!data) return;

    const doc = new jsPDF("p", "pt", "a4");
    doc.setFontSize(16);
    doc.text(`Company: ${data.name}`, 20, 30);

    const tableColumns = ["Allocated Slots", "Monthly Cost", "Yearly Cost"];
    const tableRows = [[data.allocatedSlots, data.monthlyCost, data.yearlyCost]];

    autoTable(doc, {
      head: [tableColumns],
      body: tableRows,
      startY: 50,
      theme: "grid",
    });

    // Bar chart
    const barCanvas = document.createElement("canvas");
    barCanvas.width = 500;
    barCanvas.height = 300;
    const ctx = barCanvas.getContext("2d");

    // Draw axes
    ctx.beginPath();
    ctx.moveTo(50, 250);
    ctx.lineTo(450, 250); // x-axis
    ctx.lineTo(450, 50);  // y-axis
    ctx.stroke();

    const barWidth = 80;
    // Monthly bar
    const monthlyHeight = (data.monthlyCost / data.yearlyCost) * 180;
    ctx.fillStyle = COLORS[0];
    ctx.fillRect(100, 250 - monthlyHeight, barWidth, monthlyHeight);
    ctx.fillStyle = "#000";
    ctx.fillText("Monthly", 105, 265);
    ctx.fillText(Math.round(data.monthlyCost), 100, 250 - monthlyHeight - 5);

    // Yearly bar
    const yearlyHeight = 180;
    ctx.fillStyle = COLORS[1];
    ctx.fillRect(250, 250 - yearlyHeight, barWidth, yearlyHeight);
    ctx.fillStyle = "#000";
    ctx.fillText("Yearly", 265, 265);
    ctx.fillText(Math.round(data.yearlyCost), 250, 250 - yearlyHeight - 5);

    const barImg = barCanvas.toDataURL("image/png");
    doc.addImage(barImg, "PNG", 50, 150, 400, 250);

    doc.save(`${data.name}-Cost-Report.pdf`);
  };

  return (
    <div className="company-container">
      <h2>Cost Report per Company</h2>
      <div style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "10px" }}>
        <input
          type="text"
          placeholder="Search Company"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ padding: "5px", flex: 1 }}
        />
        <button onClick={downloadFullPDF}>Download Full Report PDF</button>
      </div>

      <table className="company-table">
        <thead>
          <tr>
            <th>Company Name</th>
            <th>Allocated Slots</th>
            <th>Monthly Cost</th>
            <th>Yearly Cost</th>
            <th>Download PDF</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((c, index) => (
            <tr key={index}>
              <td>{c.name}</td>
              <td>{c.allocatedSlots}</td>
              <td>{c.monthlyCost}</td>
              <td>{c.yearlyCost}</td>
              <td>
                <button onClick={() => downloadCompanyPDF(c.name)}>Download PDF</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
          {/* Go to Dashboard Button */}
    <div style={{ marginTop: "20px" }}>
      <button
        className="back-button"
        onClick={() => navigate("/dashboard")}
        style={{ padding: "10px 20px", cursor: "pointer" }}
      >
        ← Go to Dashboard
      </button>
    </div>
    </div>
  );
};

export default CostReport;
