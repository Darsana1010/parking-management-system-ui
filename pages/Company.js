import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Company.css";

const CompanyRegistration = () => {
  const [companies, setCompanies] = useState([]);
  const [newCompany, setNewCompany] = useState({
    companyName: "",
    allocatedParkingSlots: "",
  });
  const [editingCompany, setEditingCompany] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    fetchCompanies(token);
  }, [navigate]);

  // Fetch companies
  const fetchCompanies = async (token) => {
    try {
      const res = await axios.get("http://localhost:8080/api/companies", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCompanies(res.data);
    } catch (err) {
      console.error("Error fetching companies", err);
      setError("Failed to load companies.");
      setTimeout(() => setError(""), 3000);
    }
  };

  // Add new company
  const handleAddCompany = async () => {
    if (!newCompany.companyName || !newCompany.allocatedParkingSlots) {
      setError("Both Company Name and Allocated Slots are mandatory.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://localhost:8080/api/companies",
        newCompany,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCompanies((prev) => [...prev, res.data]);
      setNewCompany({ companyName: "", allocatedParkingSlots: "" });
      setMessage(`Company ${res.data.companyName} added successfully.`);
      setError("");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error adding company", err);
      setError("Failed to add company.");
      setTimeout(() => setError(""), 3000);
    }
  };

  // Edit company
  const startEdit = (company) => {
    setEditingCompany({ ...company });
    setError("");
  };

  const handleSaveEdit = async () => {
    if (!editingCompany.companyName || !editingCompany.allocatedParkingSlots) {
      setError("Both Company Name and Allocated Slots are mandatory.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:8080/api/companies/${editingCompany.companyId}`,
        editingCompany,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCompanies((prev) =>
        prev.map((c) =>
          c.companyId === editingCompany.companyId ? editingCompany : c
        )
      );
      setMessage(`Company ${editingCompany.companyName} updated successfully.`);
      setEditingCompany(null);
      setError("");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error updating company", err);
      setError("Failed to update company.");
      setTimeout(() => setError(""), 3000);
    }
  };

  // Delete company
  const handleDelete = async (companyId) => {
    if (!window.confirm("Are you sure you want to delete this company?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:8080/api/companies/${companyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCompanies((prev) => prev.filter((c) => c.companyId !== companyId));
      setMessage("Company deleted successfully.");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error("Error deleting company", err);
      setError("Failed to delete company.");
      setTimeout(() => setError(""), 3000);
    }
  };

  // Filter companies by search
  const filteredCompanies = companies.filter(
    (c) =>
      c.companyName &&
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="company-container">
      <h2>Company Management</h2>

      {/* Success & Error Messages */}
      {message && <div className="success-message">{message}</div>}
      {error && (
        <div className="error-message" role="alert" aria-live="assertive">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search companies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Add Company Form */}
      <div className="add-company-form">
        <input
          type="text"
          placeholder="Company Name"
          value={newCompany.companyName}
          onChange={(e) =>
            setNewCompany((prev) => ({ ...prev, companyName: e.target.value }))
          }
        />
        <input
          type="number"
          placeholder="Allocated Parking Slots"
          value={newCompany.allocatedParkingSlots}
          onChange={(e) =>
            setNewCompany((prev) => ({
              ...prev,
              allocatedParkingSlots: e.target.value,
            }))
          }
        />
        <button onClick={handleAddCompany}>Add Company</button>
      </div>

      {/* Companies Table */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Company Name</th>
            <th>Allocated Parking Slots</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCompanies.map((c) => (
            <tr key={c.companyId}>
              <td>{c.companyId}</td>
              <td>
                {editingCompany && editingCompany.companyId === c.companyId ? (
                  <input
                    type="text"
                    value={editingCompany.companyName || ""}
                    onChange={(e) =>
                      setEditingCompany((prev) => ({
                        ...prev,
                        companyName: e.target.value,
                      }))
                    }
                  />
                ) : (
                  c.companyName || ""
                )}
              </td>
              <td>
                {editingCompany && editingCompany.companyId === c.companyId ? (
                  <input
                    type="number"
                    value={editingCompany.allocatedParkingSlots || ""}
                    onChange={(e) =>
                      setEditingCompany((prev) => ({
                        ...prev,
                        allocatedParkingSlots: e.target.value,
                      }))
                    }
                  />
                ) : (
                  c.allocatedParkingSlots || ""
                )}
              </td>
              <td>
                {editingCompany && editingCompany.companyId === c.companyId ? (
                  <button onClick={handleSaveEdit} className="save-btn">
                    Save
                  </button>
                ) : (
                  <>
                    <button onClick={() => startEdit(c)} className="edit-btn">
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c.companyId)}
                      className="admin-cancel-btn"
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="back-button" onClick={() => navigate("/dashboard")}>
        ← Back to Dashboard
      </button>
    </div>
  );
};

export default CompanyRegistration;
