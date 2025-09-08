import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Chart from "chart.js/auto";
import "./Company.css";

const UsageReport = () => {
  const [companies, setCompanies] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [availableYears, setAvailableYears] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const navigate = useNavigate();

  const COST_PER_SLOT = 50;
  const GUEST_SLOT_COST = COST_PER_SLOT + 10;

  const barChartRef = useRef(null);
  const barChartInstance = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchCompanies(token);
    fetchBookings(token);
  }, [navigate]);

  const fetchCompanies = async (token) => {
    try {
      const response = await axios.get("http://localhost:8080/api/companies", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCompanies(response.data.filter(c => c.companyId !== 1));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBookings = async (token) => {
    try {
      const response = await axios.get("http://localhost:8080/api/bookings/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(response.data);

      const yearsSet = new Set();
      const monthsSet = new Set();

      response.data.forEach(b => {
        const dateObj = new Date(b.bookingDate);
        if (!isNaN(dateObj)) {
          yearsSet.add(dateObj.getFullYear());
          monthsSet.add(dateObj.getMonth() + 1);
        }
      });

      const sortedYears = Array.from(yearsSet).sort((a, b) => a - b);
      const sortedMonths = Array.from(monthsSet).sort((a, b) => a - b);

      setAvailableYears(sortedYears);
      setAvailableMonths(sortedMonths);

      const today = new Date();
      const currYear = today.getFullYear();
      const currMonth = today.getMonth() + 1;

      setSelectedYear(sortedYears.includes(currYear) ? currYear : sortedYears[0]);
      setSelectedMonth(sortedMonths.includes(currMonth) ? currMonth : sortedMonths[0]);
    } catch (err) {
      console.error(err);
    }
  };

  const getUsageData = () => {
    const today = new Date().toISOString().split("T")[0];

    return companies.map(company => {
      const companyBookings = bookings.filter(b => b.companyId === company.companyId);
      const monthlyData = {};

      companyBookings.forEach(b => {
        const date = new Date(b.bookingDate);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}-${("0" + month).slice(-2)}`;

        if (!monthlyData[key]) {
          monthlyData[key] = { total: 0, guest: 0, noShow: 0, cancelled: 0, projected: 0, actual: 0 };
        }

        monthlyData[key].total++;

        if (b.slotNumber.startsWith("GUEST")) {
          monthlyData[key].guest++;
          monthlyData[key].actual += GUEST_SLOT_COST;
        }

        if (b.status === "Cancelled") monthlyData[key].cancelled++;

        const isPast = b.bookingDate < today;
        if ((b.status === "Confirmed" || b.status === "Expired") && !b.hasArrived && isPast)
          monthlyData[key].noShow++;
      });

      Object.keys(monthlyData).forEach(key => {
        const projected = company.allocatedParkingSlots * COST_PER_SLOT * 30;
        monthlyData[key].projected = projected;
        monthlyData[key].actual += projected;
      });

      return { company, monthlyData };
    });
  };

  const processedData = getUsageData();

  const filteredData = processedData
    .filter(c => c.company.companyName.toLowerCase().includes(searchQuery.toLowerCase()))
    .map(c => {
      const key = `${selectedYear}-${("0" + selectedMonth).slice(-2)}`;
      return {
        company: c.company.companyName,
        metrics: c.monthlyData[key] || { total: 0, guest: 0, cancelled: 0, noShow: 0, projected: 0, actual: 0 }
      };
    });

  const tableData = filteredData.map(d => ({
    company: d.company,
    total: d.metrics.total,
    guest: d.metrics.guest,
    cancelled: d.metrics.cancelled,
    noShow: d.metrics.noShow,
    projected: d.metrics.projected,
    actual: d.metrics.actual
  }));

  useEffect(() => {
    if (barChartInstance.current) barChartInstance.current.destroy();
    const ctx = barChartRef.current.getContext("2d");
    barChartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: tableData.map(d => d.company),
        datasets: [
          { label: "Projected Cost", data: tableData.map(d => d.projected), backgroundColor: "#3e95cd" },
          { label: "Actual Cost", data: tableData.map(d => d.actual), backgroundColor: "#8e5ea2" }
        ]
      },
      options: { responsive: true, plugins: { legend: { position: "top" } } }
    });
  }, [tableData]);

  const downloadFullPDF = async () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Usage Report - ${selectedYear}-${("0" + selectedMonth).slice(-2)}`, 20, 20);

    const metrics = ["Total Bookings", "Guest", "Cancelled", "No Shows", "Projected Cost", "Actual Cost"];
    const bodyData = tableData.map(d => [
      d.company, d.total, d.guest, d.cancelled, d.noShow, `₹${d.projected}`, `₹${d.actual}`
    ]);
    autoTable(doc, { head: [["Company", ...metrics]], body: bodyData, startY: 30 });

    // Bar chart
    const barCanvas = document.createElement("canvas");
    barCanvas.width = 800; barCanvas.height = 400;
    const barCtx = barCanvas.getContext("2d");
    new Chart(barCtx, {
      type: "bar",
      data: {
        labels: tableData.map(d => d.company),
        datasets: [
          { label: "Projected Cost", data: tableData.map(d => d.projected), backgroundColor: "#3e95cd" },
          { label: "Actual Cost", data: tableData.map(d => d.actual), backgroundColor: "#8e5ea2" }
        ]
      },
      options: { responsive: false, plugins: { legend: { position: "top" } } }
    });
    await new Promise(r => setTimeout(r, 500));
    const barImg = barCanvas.toDataURL("image/png");
    doc.addPage();
    doc.text("Projected vs Actual Cost", 20, 20);
    doc.addImage(barImg, "PNG", 15, 40, 180, 100);

    // Pie chart with percentages
    for (let d of tableData) {
      const pieCanvas = document.createElement("canvas");
      pieCanvas.width = 400; pieCanvas.height = 400;
      const pieCtx = pieCanvas.getContext("2d");

      const pieData = [];
      const pieLabels = [];
      const pieColors = [];

      if (d.cancelled > 0) { pieData.push(d.cancelled); pieLabels.push("Cancelled"); pieColors.push("#3cba9f"); }
      if (d.noShow > 0) { pieData.push(d.noShow); pieLabels.push("No Shows"); pieColors.push("#e8c3b9"); }
      if (d.guest > 0) { pieData.push(d.guest); pieLabels.push("Guest"); pieColors.push("#f4c20d"); }

      if (pieData.length > 0) {
        new Chart(pieCtx, {
          type: "pie",
          data: { labels: pieLabels, datasets: [{ data: pieData, backgroundColor: pieColors }] },
          options: {
            responsive: false,
            plugins: {
              legend: { position: "top" },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const total = pieData.reduce((a,b) => a+b, 0);
                    const val = context.raw;
                    const percent = ((val / total) * 100).toFixed(1);
                    return `${context.label}: ${val} (${percent}%)`;
                  }
                }
              }
            }
          }
        });
        await new Promise(r => setTimeout(r, 500));
        const pieImg = pieCanvas.toDataURL("image/png");
        doc.addPage();
        doc.text(`${d.company} - Cancelled, No Shows & Guest`, 20, 20);
        doc.addImage(pieImg, "PNG", 30, 40, 150, 150);
      }
    }

    doc.save("Usage-Report.pdf");
  };

  return (
    <div className="company-container">
      <h2>Usage Report per Company</h2>

      <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
        <input type="text" placeholder="Search Company" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1, padding: "5px" }} />
        <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} style={{ padding: "5px" }}>
          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} style={{ padding: "5px" }}>
          {availableMonths.map(m => <option key={m} value={m}>{("0" + m).slice(-2)}</option>)}
        </select>
        <button onClick={downloadFullPDF}>Download PDF</button>
      </div>

      <canvas ref={barChartRef} style={{ maxWidth: "100%", marginBottom: "30px" }} />

      <table className="company-table">
        <thead>
          <tr>
            <th>Company</th>
            <th>Total Bookings</th>
            <th>Guest</th>
            <th>Cancelled</th>
            <th>No Shows</th>
            <th>Projected Cost</th>
            <th>Actual Cost</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((d, i) => (
            <tr key={i}>
              <td>{d.company}</td>
              <td>{d.total}</td>
              <td>{d.guest}</td>
              <td>{d.cancelled}</td>
              <td>{d.noShow}</td>
              <td>₹{d.projected}</td>
              <td>₹{d.actual}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: "20px" }}>
        <button onClick={() => navigate("/reports")} style={{ padding: "10px 20px", cursor: "pointer" }}>← Back to Report Dashboard</button>
      </div>
    </div>
  );
};

export default UsageReport;
