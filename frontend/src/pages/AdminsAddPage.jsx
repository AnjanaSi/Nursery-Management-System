import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpg";
import { createAdmin, createAdminWithAccount } from "../services/api/adminsService";
import "./AdminPages.css";

const ADMIN_TYPES = [
  { value: "OWNER", label: "Owner" },
  { value: "FAMILY_MEMBER", label: "Family Member" },
  { value: "OTHER", label: "Other" },
];

const today = new Date().toISOString().split("T")[0];

export default function AdminsAddPage() {
  const navigate = useNavigate();
  const [validated, setValidated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
    nic: "",
    dateOfBirth: "",
    adminType: "",
    notes: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const buildPayload = () => {
    const data = { ...form };
    if (!data.adminType) delete data.adminType;
    if (!data.address) delete data.address;
    if (!data.nic) delete data.nic;
    if (!data.dateOfBirth) delete data.dateOfBirth;
    if (!data.notes) delete data.notes;
    return data;
  };

  const handleSubmit = async (e, withAccount = false) => {
    e.preventDefault();
    const formEl = e.target.closest("form");
    if (!formEl.checkValidity()) {
      setValidated(true);
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const data = buildPayload();
      if (withAccount) {
        await createAdminWithAccount(data);
        setSuccess("Admin registered and login account created successfully!");
      } else {
        await createAdmin(data);
        setSuccess("Admin registered successfully!");
      }
      setTimeout(() => navigate("/admin/admins/list"), 1500);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to register admin. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="admin-mgmt-header d-flex align-items-center gap-3">
        <img src={logo} alt="MerryKids" className="admin-mgmt-header-logo" />
        <div>
          <h5 className="fw-bold mb-0" style={{ color: "var(--mk-blue)" }}>
            Add New Admin
          </h5>
          <small className="text-muted">Register a new admin profile</small>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")} />
        </div>
      )}
      {success && (
        <div className="alert alert-success fade show" role="alert">
          {success}
        </div>
      )}

      <form noValidate className={validated ? "was-validated" : ""}>
        {/* Personal Information */}
        <div className="admin-form-section">
          <div className="admin-form-section-title">Personal Information</div>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className="form-control rounded-3"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
              />
              <div className="invalid-feedback">Full name is required.</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Email *</label>
              <input
                type="email"
                className="form-control rounded-3"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
              <div className="invalid-feedback">Valid email is required.</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                className="form-control rounded-3"
                name="phoneNumber"
                value={form.phoneNumber}
                onChange={handleChange}
                required
              />
              <div className="invalid-feedback">Phone number is required.</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                className="form-control rounded-3"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
                max={today}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">NIC / National ID</label>
              <input
                type="text"
                className="form-control rounded-3"
                name="nic"
                value={form.nic}
                onChange={handleChange}
              />
            </div>
            <div className="col-12">
              <label className="form-label">Address</label>
              <textarea
                className="form-control rounded-3"
                name="address"
                value={form.address}
                onChange={handleChange}
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Role / Relationship */}
        <div className="admin-form-section">
          <div className="admin-form-section-title">Role / Relationship</div>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Admin Type</label>
              <select
                className="form-select rounded-3"
                name="adminType"
                value={form.adminType}
                onChange={handleChange}
              >
                <option value="">-- Select --</option>
                {ADMIN_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="admin-form-section">
          <div className="admin-form-section-title">Notes</div>
          <textarea
            className="form-control rounded-3"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Optional notes about this admin..."
          />
        </div>

        {/* Action Buttons */}
        <div className="d-flex flex-wrap gap-2 mt-3">
          <button
            type="submit"
            className="btn btn-primary rounded-3 admin-action-btn"
            disabled={submitting}
            onClick={(e) => handleSubmit(e, false)}
          >
            {submitting && <span className="spinner-border spinner-border-sm me-2" />}
            Save Admin
          </button>
          <button
            type="button"
            className="btn rounded-3 admin-action-btn"
            style={{ background: "var(--mk-pink)", color: "#fff", border: "none" }}
            disabled={submitting}
            onClick={(e) => handleSubmit(e, true)}
          >
            {submitting && <span className="spinner-border spinner-border-sm me-2" />}
            Save &amp; Create Account
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary rounded-3 admin-action-btn"
            onClick={() => navigate("/admin/admins")}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
