import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createStudent,
  updateStudent,
  getStudentById,
  fetchStudentPhotoBlob,
} from "../services/api/studentsApi";
import "./StudentPages.css";

const ENTRY_LEVELS = ["LKG1", "UKG1"];
const ALL_LEVELS = ["LKG1", "UKG1", "UKG2"];
const GENDERS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
];

const today = new Date().toISOString().split("T")[0];

const emptyGuardian = (relType) => ({
  id: null,
  fullName: "",
  email: "",
  phone: "",
  nic: "",
  address: "",
  relationshipType: relType,
});

export default function StudentFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [validated, setValidated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loadingData, setLoadingData] = useState(isEdit);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [serverPhotoSrc, setServerPhotoSrc] = useState(null);
  const [showThirdGuardian, setShowThirdGuardian] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    entryLevel: "",
    enrollmentDate: "",
    notes: "",
  });

  const [guardians, setGuardians] = useState([
    emptyGuardian("FATHER"),
    emptyGuardian("MOTHER"),
  ]);

  // Existing guardian account info (for edit mode email-change warning)
  const [existingGuardians, setExistingGuardians] = useState([]);

  const loadStudent = useCallback(async () => {
    if (!isEdit) return;
    setLoadingData(true);
    setError("");
    try {
      const res = await getStudentById(id);
      const s = res.data;
      setForm({
        fullName: s.fullName || "",
        dateOfBirth: s.dateOfBirth || "",
        gender: s.gender || "",
        entryLevel: s.entryLevel || "",
        currentLevel: s.currentLevel || "",
        enrollmentDate: s.enrollmentDate || "",
        notes: s.notes || "",
      });

      const gs = (s.guardians || []).map((g) => ({
        id: g.id,
        fullName: g.fullName || "",
        email: g.email || "",
        phone: g.phone || "",
        nic: g.nic || "",
        address: g.address || "",
        relationshipType: g.relationshipType || "GUARDIAN",
      }));

      setExistingGuardians(
        (s.guardians || []).map((g) => ({
          id: g.id,
          email: g.email,
          accountStatus: g.accountStatus,
        }))
      );

      // Ensure father and mother slots exist
      const father = gs.find((g) => g.relationshipType === "FATHER") || emptyGuardian("FATHER");
      const mother = gs.find((g) => g.relationshipType === "MOTHER") || emptyGuardian("MOTHER");
      const additional = gs.find((g) => g.relationshipType === "GUARDIAN");

      const guardianList = [father, mother];
      if (additional) {
        guardianList.push(additional);
        setShowThirdGuardian(true);
      }
      setGuardians(guardianList);

      // Load photo
      if (s.hasPhoto) {
        try {
          const blob = await fetchStudentPhotoBlob(id);
          setServerPhotoSrc(URL.createObjectURL(blob));
        } catch {
          /* no photo */
        }
      }
    } catch {
      setError("Failed to load student data.");
    } finally {
      setLoadingData(false);
    }
  }, [id, isEdit]);

  useEffect(() => {
    loadStudent();
  }, [loadStudent]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGuardianChange = (idx, e) => {
    const updated = [...guardians];
    updated[idx] = { ...updated[idx], [e.target.name]: e.target.value };
    setGuardians(updated);
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

  const addThirdGuardian = () => {
    setGuardians([...guardians, emptyGuardian("GUARDIAN")]);
    setShowThirdGuardian(true);
  };

  const removeThirdGuardian = () => {
    setGuardians(guardians.slice(0, 2));
    setShowThirdGuardian(false);
  };

  const buildPayload = () => {
    const data = { ...form };
    if (!data.notes) delete data.notes;
    if (isEdit) {
      delete data.entryLevel; // Cannot change entry level in edit
    }

    data.guardians = guardians.map((g) => {
      const gData = {
        fullName: g.fullName,
        phone: g.phone,
        relationshipType: g.relationshipType,
      };
      if (g.id) gData.id = g.id;
      if (g.email) gData.email = g.email;
      if (g.nic) gData.nic = g.nic;
      if (g.address) gData.address = g.address;

      // Check if email changed for a guardian with a linked account
      if (isEdit && g.id) {
        const existing = existingGuardians.find((eg) => eg.id === g.id);
        if (
          existing &&
          (existing.accountStatus === "ACTIVE" || existing.accountStatus === "DISABLED") &&
          g.email &&
          existing.email &&
          g.email.toLowerCase() !== existing.email.toLowerCase()
        ) {
          gData.updateLoginEmail = true;
        }
      }
      return gData;
    });

    return data;
  };

  const handleSubmit = async (e, createAccounts = false) => {
    e.preventDefault();
    const formEl = e.target.closest("form");
    if (!formEl.checkValidity()) {
      setValidated(true);
      return;
    }

    // Warn about guardian email changes with linked accounts
    if (isEdit) {
      const changedGuardians = guardians.filter((g) => {
        if (!g.id) return false;
        const existing = existingGuardians.find((eg) => eg.id === g.id);
        return (
          existing &&
          (existing.accountStatus === "ACTIVE" || existing.accountStatus === "DISABLED") &&
          g.email &&
          existing.email &&
          g.email.toLowerCase() !== existing.email.toLowerCase()
        );
      });
      if (changedGuardians.length > 0) {
        const ok = window.confirm(
          "One or more guardians have linked portal accounts.\n\n" +
            "Changing their email will also change their LOGIN email.\n\n" +
            "Do you want to continue?"
        );
        if (!ok) return;
      }
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const data = buildPayload();
      if (isEdit) {
        await updateStudent(id, data, photoFile, createAccounts);
        setSuccess("Student updated successfully!");
      } else {
        await createStudent(data, photoFile, createAccounts);
        setSuccess(
          createAccounts
            ? "Student registered and guardian accounts created!"
            : "Student registered successfully!"
        );
      }
      setTimeout(() => navigate("/admin/students/list"), 1500);
    } catch (err) {
      const msg =
        err.response?.data?.error || "Failed to save student. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const RELATION_LABEL = {
    FATHER: "Father",
    MOTHER: "Mother",
    GUARDIAN: "Additional Guardian",
  };

  const renderGuardianSection = (g, idx) => (
    <div key={idx} className="student-form-section">
      <div className="student-form-section-title">
        {RELATION_LABEL[g.relationshipType] || "Guardian"} (Required)
        {g.relationshipType === "GUARDIAN" && (
          <button
            type="button"
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={removeThirdGuardian}
          >
            Remove
          </button>
        )}
      </div>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Full Name *</label>
          <input
            type="text"
            className="form-control rounded-3"
            name="fullName"
            value={g.fullName}
            onChange={(e) => handleGuardianChange(idx, e)}
            required
          />
          <div className="invalid-feedback">Guardian name is required.</div>
        </div>
        <div className="col-md-6">
          <label className="form-label">Phone *</label>
          <input
            type="tel"
            className="form-control rounded-3"
            name="phone"
            value={g.phone}
            onChange={(e) => handleGuardianChange(idx, e)}
            required
          />
          <div className="invalid-feedback">Phone is required.</div>
        </div>
        <div className="col-md-6">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control rounded-3"
            name="email"
            value={g.email}
            onChange={(e) => handleGuardianChange(idx, e)}
          />
          <div className="invalid-feedback">Enter a valid email.</div>
        </div>
        <div className="col-md-6">
          <label className="form-label">NIC</label>
          <input
            type="text"
            className="form-control rounded-3"
            name="nic"
            value={g.nic}
            onChange={(e) => handleGuardianChange(idx, e)}
          />
        </div>
        <div className="col-12">
          <label className="form-label">Address</label>
          <textarea
            className="form-control rounded-3"
            name="address"
            value={g.address}
            onChange={(e) => handleGuardianChange(idx, e)}
            rows={2}
          />
        </div>
      </div>
    </div>
  );

  if (loadingData) {
    return (
      <div>
        <div className="mb-4">
          <h4 className="fw-bold mb-1" style={{ color: "var(--mk-blue)" }}>
            {isEdit ? "Edit Student" : "Register New Student"}
          </h4>
        </div>
        <div className="text-center py-5">
          <span className="spinner-border text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1" style={{ color: "var(--mk-blue)" }}>
          {isEdit ? "Edit Student" : "Register New Student"}
        </h4>
        <p className="text-muted mb-0">
          {isEdit
            ? "Update student and guardian details"
            : "Enroll a new student with guardian information"}
        </p>
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
        {/* Student Information */}
        <div className="student-form-section">
          <div className="student-form-section-title">Student Information</div>
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
              <label className="form-label">Gender *</label>
              <select
                className="form-select rounded-3"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                required
              >
                <option value="">-- Select Gender --</option>
                {GENDERS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
              <div className="invalid-feedback">Gender is required.</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">
                {isEdit ? "Current Level" : "Entry Level *"}
              </label>
              {isEdit ? (
                <select
                  className="form-select rounded-3"
                  name="currentLevel"
                  value={form.currentLevel || ""}
                  onChange={handleChange}
                >
                  {ALL_LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              ) : (
                <select
                  className="form-select rounded-3"
                  name="entryLevel"
                  value={form.entryLevel}
                  onChange={handleChange}
                  required
                >
                  <option value="">-- Select Level --</option>
                  {ENTRY_LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              )}
              <div className="invalid-feedback">Level is required.</div>
            </div>
            <div className="col-md-6">
              <label className="form-label">Enrollment Date *</label>
              <input
                type="date"
                className="form-control rounded-3"
                name="enrollmentDate"
                value={form.enrollmentDate}
                onChange={handleChange}
                required
              />
              <div className="invalid-feedback">Enrollment date is required.</div>
            </div>
          </div>
        </div>

        {/* Guardian Sections */}
        {guardians.map((g, idx) => renderGuardianSection(g, idx))}

        {!showThirdGuardian && (
          <button
            type="button"
            className="btn btn-outline-primary btn-sm rounded-3 mb-3"
            onClick={addThirdGuardian}
          >
            + Add Additional Guardian
          </button>
        )}

        {/* Profile Photo */}
        <div className="student-form-section">
          <div className="student-form-section-title">Profile Photo</div>
          <div className="d-flex align-items-center gap-4">
            {photoPreview || serverPhotoSrc ? (
              <img
                src={photoPreview || serverPhotoSrc}
                alt="Preview"
                className="student-photo-preview"
              />
            ) : (
              <div className="student-photo-placeholder">
                <span>&#128102;</span>
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
        <div className="student-form-section">
          <div className="student-form-section-title">Notes</div>
          <textarea
            className="form-control rounded-3"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Optional notes about this student..."
          />
        </div>

        {/* Action Buttons */}
        <div className="d-flex flex-wrap gap-2 mt-3">
          <button
            type="submit"
            className="btn btn-primary rounded-3"
            disabled={submitting}
            onClick={(e) => handleSubmit(e, false)}
          >
            {submitting ? (
              <span className="spinner-border spinner-border-sm me-2" />
            ) : null}
            {isEdit ? "Save Changes" : "Save Student"}
          </button>
          <button
            type="button"
            className="btn rounded-3"
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
            {isEdit ? "Save & Create Accounts" : "Save & Create Guardian Accounts"}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary rounded-3"
            onClick={() => navigate(isEdit ? `/admin/students/${id}` : "/admin/students")}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
