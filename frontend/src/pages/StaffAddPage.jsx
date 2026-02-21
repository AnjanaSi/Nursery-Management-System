import { useState } from "react";
import { useNavigate } from "react-router-dom";
import StaffModuleHeader from "../components/StaffModuleHeader";
import { createStaff, createStaffWithAccount } from "../services/api/staffService";
import "./StaffPages.css";

const LEVELS = ["LKG1", "UKG1", "UKG2"];
const DESIGNATIONS = [
  { value: "ASSISTANT_TEACHER", label: "Assistant Teacher" },
  { value: "TEACHER", label: "Teacher" },
  { value: "SENIOR_TEACHER", label: "Senior Teacher" },
  { value: "PRINCIPAL", label: "Principal" },
];
const MARITAL_STATUSES = ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"];

const today = new Date().toISOString().split("T")[0];

export default function StaffAddPage() {
  const navigate = useNavigate();
  const [validated, setValidated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    dateOfBirth: "",
    email: "",
    phoneNumber: "",
    permanentAddress: "",
    currentAddress: "",
    emergencyContactName: "",
    emergencyContactNumber: "",
    maritalStatus: "",
    dateOfJoining: "",
    levelAssigned: "",
    designation: "",
    notes: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("Only JPEG, PNG, or WEBP images are accepted.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be under 5MB.");
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setError("");
    }
  };

  const buildPayload = () => {
    const data = { ...form };
    if (!data.maritalStatus) delete data.maritalStatus;
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
        await createStaffWithAccount(data, photoFile);
        setSuccess("Teacher registered and login account created successfully!");
      } else {
        await createStaff(data, photoFile);
        setSuccess("Teacher registered successfully!");
      }
      setTimeout(() => navigate("/admin/staff/list"), 1500);
    } catch (err) {
      const msg =
        err.response?.data?.error || "Failed to register teacher. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <StaffModuleHeader
        title="Add New Teacher"
        subtitle="Register a new staff member"
      />

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
        <div className="staff-form-section">
          <div className="staff-form-section-title">Personal Information</div>
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
              <label className="form-label">Date of Birth *</label>
              <input
                type="date"
                className="form-control rounded-3"
                name="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
                max={today}
                required
              />
              <div className="invalid-feedback">Valid date of birth is required.</div>
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
            <div className="col-12">
              <label className="form-label">Permanent Address *</label>
              <textarea
                className="form-control rounded-3"
                name="permanentAddress"
                value={form.permanentAddress}
                onChange={handleChange}
                rows={2}
                required
              />
              <div className="invalid-feedback">Permanent address is required.</div>
            </div>
            <div className="col-12">
              <label className="form-label">Current Address *</label>
              <textarea
                className="form-control rounded-3"
                name="currentAddress"
                value={form.currentAddress}
                onChange={handleChange}
                rows={2}
                required
              />
              <div className="invalid-feedback">Current address is required.</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Marital Status</label>
              <select
                className="form-select rounded-3"
                name="maritalStatus"
                value={form.maritalStatus}
                onChange={handleChange}
              >
                <option value="">-- Select --</option>
                {MARITAL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Employment Details */}
        <div className="staff-form-section">
          <div className="staff-form-section-title">Employment Details</div>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Date of Joining *</label>
              <input
                type="date"
                className="form-control rounded-3"
                name="dateOfJoining"
                value={form.dateOfJoining}
                onChange={handleChange}
                max={today}
                required
              />
              <div className="invalid-feedback">Date of joining is required.</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Level Assigned *</label>
              <select
                className="form-select rounded-3"
                name="levelAssigned"
                value={form.levelAssigned}
                onChange={handleChange}
                required
              >
                <option value="">-- Select Level --</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <div className="invalid-feedback">Level is required.</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Designation *</label>
              <select
                className="form-select rounded-3"
                name="designation"
                value={form.designation}
                onChange={handleChange}
                required
              >
                <option value="">-- Select Designation --</option>
                {DESIGNATIONS.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
              <div className="invalid-feedback">Designation is required.</div>
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="staff-form-section">
          <div className="staff-form-section-title">Emergency Contact</div>
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Contact Name *</label>
              <input
                type="text"
                className="form-control rounded-3"
                name="emergencyContactName"
                value={form.emergencyContactName}
                onChange={handleChange}
                required
              />
              <div className="invalid-feedback">Emergency contact name is required.</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Contact Number *</label>
              <input
                type="tel"
                className="form-control rounded-3"
                name="emergencyContactNumber"
                value={form.emergencyContactNumber}
                onChange={handleChange}
                required
              />
              <div className="invalid-feedback">Emergency contact number is required.</div>
            </div>
          </div>
        </div>

        {/* Profile Photo */}
        <div className="staff-form-section">
          <div className="staff-form-section-title">Profile Photo</div>
          <div className="d-flex align-items-center gap-4">
            {photoPreview ? (
              <img src={photoPreview} alt="Preview" className="staff-photo-preview" />
            ) : (
              <div className="staff-photo-placeholder">
                <span>&#128100;</span>
              </div>
            )}
            <div>
              <input
                type="file"
                className="form-control rounded-3"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
              />
              <small className="text-muted">
                JPEG, PNG or WEBP. Max 5MB. Optional.
              </small>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="staff-form-section">
          <div className="staff-form-section-title">Notes</div>
          <textarea
            className="form-control rounded-3"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Optional notes about this teacher..."
          />
        </div>

        {/* Action Buttons */}
        <div className="d-flex flex-wrap gap-2 mt-3">
          <button
            type="submit"
            className="btn btn-primary rounded-3 staff-action-btn"
            disabled={submitting}
            onClick={(e) => handleSubmit(e, false)}
          >
            {submitting ? (
              <span className="spinner-border spinner-border-sm me-2" />
            ) : null}
            Save Teacher
          </button>
          <button
            type="button"
            className="btn rounded-3 staff-action-btn"
            style={{
              background: "var(--mk-pink)",
              color: "#fff",
              border: "none",
            }}
            disabled={submitting}
            onClick={(e) => handleSubmit(e, true)}
          >
            {submitting ? (
              <span className="spinner-border spinner-border-sm me-2" />
            ) : null}
            Save &amp; Create Account
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary rounded-3 staff-action-btn"
            onClick={() => navigate("/admin/staff")}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
