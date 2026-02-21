import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StaffModuleHeader from "../components/StaffModuleHeader";
import {
  getStaffById,
  updateStaff,
  deleteStaff,
  createStaffAccount,
  revokeStaffAccount,
  fetchStaffPhotoBlob,
} from "../services/api/staffService";
import "./StaffPages.css";

const LEVELS = ["LKG1", "UKG1", "UKG2"];
const DESIGNATIONS = [
  { value: "ASSISTANT_TEACHER", label: "Assistant Teacher" },
  { value: "TEACHER", label: "Teacher" },
  { value: "SENIOR_TEACHER", label: "Senior Teacher" },
  { value: "PRINCIPAL", label: "Principal" },
];
const STATUSES = ["ACTIVE", "RESIGNED", "RETIRED", "TERMINATED"];
const MARITAL_STATUSES = ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED"];

const STATUS_BADGE = {
  ACTIVE: "badge-active",
  RESIGNED: "badge-resigned",
  RETIRED: "badge-retired",
  TERMINATED: "badge-terminated",
};
const ACCOUNT_BADGE = {
  ACTIVE: "badge-account-active",
  NO_ACCOUNT: "badge-no-account",
  DISABLED: "badge-disabled",
};
const ACCOUNT_LABEL = {
  ACTIVE: "Account Active",
  NO_ACCOUNT: "No Account",
  DISABLED: "Disabled",
};
const DESIGNATION_LABEL = {
  ASSISTANT_TEACHER: "Assistant Teacher",
  TEACHER: "Teacher",
  SENIOR_TEACHER: "Senior Teacher",
  PRINCIPAL: "Principal",
};

const today = new Date().toISOString().split("T")[0];

export default function StaffDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [serverPhotoSrc, setServerPhotoSrc] = useState(null);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [validated, setValidated] = useState(false);

  // Account actions
  const [accountLoading, setAccountLoading] = useState(false);

  // Delete
  const [deleting, setDeleting] = useState(false);
  const deleteModalRef = useRef(null);

  // Revoke modal
  const revokeModalRef = useRef(null);

  const fetchTeacher = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getStaffById(id);
      setTeacher(res.data);
    } catch {
      setError("Failed to load teacher details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTeacher();
  }, [fetchTeacher]);

  useEffect(() => {
    let url;

    const loadPhoto = async () => {
      if (!teacher?.id) return;
      try {
        const blob = await fetchStaffPhotoBlob(teacher.id);
        url = URL.createObjectURL(blob);
        setServerPhotoSrc(url);
      } catch {
        setServerPhotoSrc(null);
      }
    };

    loadPhoto();

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [teacher?.id, teacher?.updatedAt]);

  const startEdit = () => {
    setEditForm({
      fullName: teacher.fullName || "",
      dateOfBirth: teacher.dateOfBirth || "",
      email: teacher.email || "",
      phoneNumber: teacher.phoneNumber || "",
      permanentAddress: teacher.permanentAddress || "",
      currentAddress: teacher.currentAddress || "",
      emergencyContactName: teacher.emergencyContactName || "",
      emergencyContactNumber: teacher.emergencyContactNumber || "",
      maritalStatus: teacher.maritalStatus || "",
      dateOfJoining: teacher.dateOfJoining || "",
      levelAssigned: teacher.levelAssigned || "",
      designation: teacher.designation || "",
      employmentStatus: teacher.employmentStatus || "",
      notes: teacher.notes || "",
    });
    setPhotoFile(null);
    setPhotoPreview(null);
    setValidated(false);
    setEditing(true);
    setSuccess("");
    setError("");
  };

  const cancelEdit = () => {
    setEditing(false);
    setError("");
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
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

  const handleSave = async (e) => {
    e.preventDefault();
    const formEl = e.target.closest("form");
    if (!formEl.checkValidity()) {
      setValidated(true);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const data = { ...editForm };
      if (!data.maritalStatus) delete data.maritalStatus;
      if (!data.notes) data.notes = "";
      const oldEmail = teacher.email;
      const newEmail = editForm.email?.trim();

      const hasAccount =
        teacher.accountStatus === "ACTIVE" ||
        teacher.accountStatus === "DISABLED";

      if (
        hasAccount &&
        newEmail &&
        oldEmail &&
        newEmail.toLowerCase() !== oldEmail.toLowerCase()
      ) {
        const ok = window.confirm(
          "This staff member already has a portal login account.\n\n" +
            "Changing the email will also change their LOGIN email (password stays the same).\n\n" +
            "Do you want to continue?",
        );
        if (!ok) {
          setEditing(false);
          setPhotoFile(null);
          setPhotoPreview(null);
          return;
        }
      }
      const res = await updateStaff(id, data, photoFile);
      setTeacher(res.data);
      setEditing(false);
      setSuccess("Teacher details updated successfully!");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update teacher.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAccount = async () => {
    setAccountLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await createStaffAccount(id);
      setTeacher(res.data);
      setSuccess(
        "Login account created successfully! A welcome email has been sent.",
      );
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create login account.");
    } finally {
      setAccountLoading(false);
    }
  };

  const handleRevokeAccount = async () => {
    setAccountLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await revokeStaffAccount(id);
      setTeacher(res.data);
      hideRevokeModal();
      setSuccess("Login access revoked successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to revoke login access.");
      hideRevokeModal();
    } finally {
      setAccountLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteStaff(id);
      hideDeleteModal();
      navigate("/admin/staff/list");
    } catch {
      setError("Failed to delete teacher.");
      hideDeleteModal();
    } finally {
      setDeleting(false);
    }
  };
  const showDeleteModal = () => {
    const el = deleteModalRef.current;
    if (!el) return;
    window.bootstrap.Modal.getOrCreateInstance(el).show();
  };

  const showRevokeModal = () => {
    const el = revokeModalRef.current;
    if (!el) return;
    window.bootstrap.Modal.getOrCreateInstance(el).show();
  };

  const hideDeleteModal = () => {
    const el = deleteModalRef.current;
    if (!el) return;
    window.bootstrap.Modal.getInstance(el)?.hide();
  };

  const hideRevokeModal = () => {
    const el = revokeModalRef.current;
    if (!el) return;
    window.bootstrap.Modal.getInstance(el)?.hide();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div>
        <StaffModuleHeader title="Staff Details" />
        <div className="text-center py-5">
          <span className="spinner-border text-primary" />
        </div>
      </div>
    );
  }

  if (error && !teacher) {
    return (
      <div>
        <StaffModuleHeader title="Staff Details" />
        <div className="alert alert-danger">{error}</div>
        <button
          className="btn btn-outline-secondary rounded-3"
          onClick={() => navigate("/admin/staff/list")}
        >
          &larr; Back to List
        </button>
      </div>
    );
  }

  if (!teacher) return null;

  const DetailField = ({ label, value }) => (
    <div className="col-md-6 col-lg-4 mb-3">
      <div className="staff-detail-label">{label}</div>
      <div className="staff-detail-value">{value || "—"}</div>
    </div>
  );

  return (
    <div>
      <StaffModuleHeader
        title="Staff Details"
        subtitle={teacher.employmentId}
      />

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError("")}
          />
        </div>
      )}
      {success && (
        <div className="alert alert-success alert-dismissible fade show">
          {success}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess("")}
          />
        </div>
      )}

      {!editing ? (
        /* ── READ-ONLY VIEW ── */
        <>
          {/* Photo + Name Header */}
          <div className="d-flex align-items-center gap-3 mb-4">
            {serverPhotoSrc ? (
              <img
                src={serverPhotoSrc}
                alt={teacher.fullName}
                className="staff-photo-preview"
              />
            ) : (
              <div className="staff-photo-placeholder">
                <span>&#128100;</span>
              </div>
            )}
            <div>
              <h4 className="fw-bold mb-1" style={{ color: "var(--mk-blue)" }}>
                {teacher.fullName}
              </h4>
              <div className="d-flex gap-2 flex-wrap">
                <span
                  className={`badge ${STATUS_BADGE[teacher.employmentStatus] || ""}`}
                >
                  {teacher.employmentStatus
                    ? teacher.employmentStatus.charAt(0) +
                      teacher.employmentStatus.slice(1).toLowerCase()
                    : ""}
                </span>
                <span
                  className={`badge ${ACCOUNT_BADGE[teacher.accountStatus] || ""}`}
                >
                  {ACCOUNT_LABEL[teacher.accountStatus] ||
                    teacher.accountStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="staff-detail-section">
            <div className="staff-form-section-title">Personal Information</div>
            <div className="row">
              <DetailField label="Full Name" value={teacher.fullName} />
              <DetailField
                label="Date of Birth"
                value={formatDate(teacher.dateOfBirth)}
              />
              <DetailField label="Email" value={teacher.email} />
              <DetailField label="Phone Number" value={teacher.phoneNumber} />
              <DetailField
                label="Marital Status"
                value={
                  teacher.maritalStatus
                    ? teacher.maritalStatus.charAt(0) +
                      teacher.maritalStatus.slice(1).toLowerCase()
                    : null
                }
              />
              <DetailField
                label="Permanent Address"
                value={teacher.permanentAddress}
              />
              <DetailField
                label="Current Address"
                value={teacher.currentAddress}
              />
            </div>
          </div>

          {/* Employment Details */}
          <div className="staff-detail-section">
            <div className="staff-form-section-title">Employment Details</div>
            <div className="row">
              <DetailField label="Employment ID" value={teacher.employmentId} />
              <DetailField
                label="Date of Joining"
                value={formatDate(teacher.dateOfJoining)}
              />
              <DetailField
                label="Level Assigned"
                value={teacher.levelAssigned}
              />
              <DetailField
                label="Designation"
                value={
                  DESIGNATION_LABEL[teacher.designation] || teacher.designation
                }
              />
              <DetailField
                label="Employment Status"
                value={
                  teacher.employmentStatus
                    ? teacher.employmentStatus.charAt(0) +
                      teacher.employmentStatus.slice(1).toLowerCase()
                    : ""
                }
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="staff-detail-section">
            <div className="staff-form-section-title">Emergency Contact</div>
            <div className="row">
              <DetailField
                label="Contact Name"
                value={teacher.emergencyContactName}
              />
              <DetailField
                label="Contact Number"
                value={teacher.emergencyContactNumber}
              />
            </div>
          </div>

          {/* Notes */}
          {teacher.notes && (
            <div className="staff-detail-section">
              <div className="staff-form-section-title">Notes</div>
              <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
                {teacher.notes}
              </p>
            </div>
          )}

          {/* Account Info */}
          <div className="staff-detail-section">
            <div className="staff-form-section-title">Portal Account</div>
            <div className="row">
              <DetailField
                label="Account Status"
                value={
                  ACCOUNT_LABEL[teacher.accountStatus] || teacher.accountStatus
                }
              />
              {teacher.accountEmail && (
                <DetailField
                  label="Account Email"
                  value={teacher.accountEmail}
                />
              )}
            </div>
          </div>

          {/* Audit */}
          <div className="staff-detail-section">
            <div className="staff-form-section-title">Audit Info</div>
            <div className="row">
              <DetailField
                label="Created At"
                value={formatDateTime(teacher.createdAt)}
              />
              <DetailField
                label="Last Updated"
                value={formatDateTime(teacher.updatedAt)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex flex-wrap gap-2 mt-3">
            <button
              className="btn btn-primary rounded-3 staff-action-btn"
              onClick={startEdit}
            >
              Edit Details
            </button>

            {teacher.accountStatus === "NO_ACCOUNT" &&
              teacher.employmentStatus === "ACTIVE" && (
                <button
                  className="btn rounded-3 staff-action-btn"
                  style={{
                    background: "var(--mk-pink)",
                    color: "#fff",
                    border: "none",
                  }}
                  onClick={handleCreateAccount}
                  disabled={accountLoading}
                >
                  {accountLoading && (
                    <span className="spinner-border spinner-border-sm me-2" />
                  )}
                  Create Login Account
                </button>
              )}

            {teacher.accountStatus === "ACTIVE" && (
              <button
                type="button"
                className="btn btn-warning rounded-3 staff-action-btn"
                onClick={showRevokeModal}
                disabled={accountLoading}
              >
                Revoke Login Access
              </button>
            )}

            <button
              type="button"
              className="btn btn-outline-danger rounded-3 staff-action-btn"
              onClick={showDeleteModal}
            >
              Delete Staff Record
            </button>

            <button
              className="btn btn-outline-secondary rounded-3 staff-action-btn"
              onClick={() => navigate("/admin/staff/list")}
            >
              &larr; Back to List
            </button>
          </div>
        </>
      ) : (
        /* ── EDIT MODE ── */
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
                  value={editForm.fullName}
                  onChange={handleEditChange}
                  required
                />
                <div className="invalid-feedback">Required.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Date of Birth *</label>
                <input
                  type="date"
                  className="form-control rounded-3"
                  name="dateOfBirth"
                  value={editForm.dateOfBirth}
                  onChange={handleEditChange}
                  max={today}
                  required
                />
                <div className="invalid-feedback">Required.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-control rounded-3"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  required
                />
                <div className="invalid-feedback">Valid email required.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Phone Number *</label>
                <input
                  type="tel"
                  className="form-control rounded-3"
                  name="phoneNumber"
                  value={editForm.phoneNumber}
                  onChange={handleEditChange}
                  required
                />
                <div className="invalid-feedback">Required.</div>
              </div>
              <div className="col-12">
                <label className="form-label">Permanent Address *</label>
                <textarea
                  className="form-control rounded-3"
                  name="permanentAddress"
                  value={editForm.permanentAddress}
                  onChange={handleEditChange}
                  rows={2}
                  required
                />
                <div className="invalid-feedback">Required.</div>
              </div>
              <div className="col-12">
                <label className="form-label">Current Address *</label>
                <textarea
                  className="form-control rounded-3"
                  name="currentAddress"
                  value={editForm.currentAddress}
                  onChange={handleEditChange}
                  rows={2}
                  required
                />
                <div className="invalid-feedback">Required.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Marital Status</label>
                <select
                  className="form-select rounded-3"
                  name="maritalStatus"
                  value={editForm.maritalStatus}
                  onChange={handleEditChange}
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
                  value={editForm.dateOfJoining}
                  onChange={handleEditChange}
                  max={today}
                  required
                />
                <div className="invalid-feedback">Required.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Level Assigned *</label>
                <select
                  className="form-select rounded-3"
                  name="levelAssigned"
                  value={editForm.levelAssigned}
                  onChange={handleEditChange}
                  required
                >
                  <option value="">-- Select --</option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <div className="invalid-feedback">Required.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Designation *</label>
                <select
                  className="form-select rounded-3"
                  name="designation"
                  value={editForm.designation}
                  onChange={handleEditChange}
                  required
                >
                  <option value="">-- Select --</option>
                  {DESIGNATIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
                <div className="invalid-feedback">Required.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Employment Status *</label>
                <select
                  className="form-select rounded-3"
                  name="employmentStatus"
                  value={editForm.employmentStatus}
                  onChange={handleEditChange}
                  required
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0) + s.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
                <div className="invalid-feedback">Required.</div>
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
                  value={editForm.emergencyContactName}
                  onChange={handleEditChange}
                  required
                />
                <div className="invalid-feedback">Required.</div>
              </div>
              <div className="col-md-6">
                <label className="form-label">Contact Number *</label>
                <input
                  type="tel"
                  className="form-control rounded-3"
                  name="emergencyContactNumber"
                  value={editForm.emergencyContactNumber}
                  onChange={handleEditChange}
                  required
                />
                <div className="invalid-feedback">Required.</div>
              </div>
            </div>
          </div>

          {/* Photo */}
          <div className="staff-form-section">
            <div className="staff-form-section-title">Profile Photo</div>
            <div className="d-flex align-items-center gap-4">
              {photoPreview || teacher.hasPhoto ? (
                <img
                  src={photoPreview || serverPhotoSrc}
                  alt="Preview"
                  className="staff-photo-preview"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
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
                  JPEG, PNG or WEBP. Max 5MB.
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
              value={editForm.notes}
              onChange={handleEditChange}
              rows={3}
            />
          </div>

          {/* Edit Action Buttons */}
          <div className="d-flex flex-wrap gap-2 mt-3">
            <button
              type="submit"
              className="btn btn-primary rounded-3 staff-action-btn"
              disabled={saving}
              onClick={handleSave}
            >
              {saving && (
                <span className="spinner-border spinner-border-sm me-2" />
              )}
              Save Changes
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary rounded-3 staff-action-btn"
              onClick={cancelEdit}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Delete Confirmation Modal */}
      <div className="modal fade" ref={deleteModalRef} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4">
            <div className="modal-header border-0">
              <h5
                className="modal-title fw-bold"
                style={{ color: "var(--mk-blue)" }}
              >
                Confirm Delete
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              />
            </div>
            <div className="modal-body">
              <p className="staff-confirm-text">
                Are you sure you want to delete{" "}
                <strong>{teacher.fullName}</strong>'s record? This will also
                revoke any linked login access.
              </p>
            </div>
            <div className="modal-footer border-0">
              <button
                type="button"
                className="btn btn-outline-secondary rounded-3"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger rounded-3"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting && (
                  <span className="spinner-border spinner-border-sm me-2" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Revoke Confirmation Modal */}
      <div className="modal fade" ref={revokeModalRef} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4">
            <div className="modal-header border-0">
              <h5
                className="modal-title fw-bold"
                style={{ color: "var(--mk-blue)" }}
              >
                Revoke Login Access
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              />
            </div>
            <div className="modal-body">
              <p className="staff-confirm-text">
                Are you sure you want to revoke login access for{" "}
                <strong>{teacher.fullName}</strong>? Their account will be
                disabled and unlinked.
              </p>
            </div>
            <div className="modal-footer border-0">
              <button
                type="button"
                className="btn btn-outline-secondary rounded-3"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-warning rounded-3"
                onClick={handleRevokeAccount}
                disabled={accountLoading}
              >
                {accountLoading && (
                  <span className="spinner-border spinner-border-sm me-2" />
                )}
                Revoke Access
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
