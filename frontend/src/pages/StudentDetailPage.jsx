import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getStudentById,
  deleteStudent,
  changeStudentStatus,
  createGuardianAccount,
  revokeGuardianAccount,
  fetchStudentPhotoBlob,
} from "../services/api/studentsApi";
import "./StudentPages.css";

const STATUS_BADGE = {
  ACTIVE: "badge-student-active",
  WITHDRAWN: "badge-student-withdrawn",
  GRADUATED: "badge-student-graduated",
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

const RELATION_LABEL = {
  FATHER: "Father",
  MOTHER: "Mother",
  GUARDIAN: "Guardian",
};

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [serverPhotoSrc, setServerPhotoSrc] = useState(null);

  // Account actions
  const [accountLoading, setAccountLoading] = useState(null); // guardianId being processed

  // Status change
  const [statusForm, setStatusForm] = useState({ status: "WITHDRAWN", leaveDate: "" });
  const [statusChanging, setStatusChanging] = useState(false);
  const statusModalRef = useRef(null);

  // Delete
  const [deleting, setDeleting] = useState(false);
  const deleteModalRef = useRef(null);

  // Revoke
  const [revokeGuardianId, setRevokeGuardianId] = useState(null);
  const revokeModalRef = useRef(null);

  const fetchStudent = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getStudentById(id);
      setStudent(res.data);
    } catch {
      setError("Failed to load student details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  useEffect(() => {
    let url;
    const loadPhoto = async () => {
      if (!student?.id || !student?.hasPhoto) return;
      try {
        const blob = await fetchStudentPhotoBlob(student.id);
        url = URL.createObjectURL(blob);
        setServerPhotoSrc(url);
      } catch {
        setServerPhotoSrc(null);
      }
    };
    loadPhoto();
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [student?.id, student?.hasPhoto]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "\u2014";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "\u2014";
    return new Date(dateStr).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  // Modal helpers
  const showModal = (ref) => {
    const el = ref.current;
    if (el) window.bootstrap.Modal.getOrCreateInstance(el).show();
  };
  const hideModal = (ref) => {
    const el = ref.current;
    if (el) window.bootstrap.Modal.getInstance(el)?.hide();
  };

  // Account actions
  const handleCreateAccount = async (guardianId) => {
    setAccountLoading(guardianId);
    setError("");
    setSuccess("");
    try {
      const res = await createGuardianAccount(id, guardianId);
      // Refresh data — response is the guardian, but let's just refetch student
      await fetchStudent();
      setSuccess("Guardian portal account created! A welcome email has been sent.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create guardian account.");
    } finally {
      setAccountLoading(null);
    }
  };

  const handleRevokeAccount = async () => {
    if (!revokeGuardianId) return;
    setAccountLoading(revokeGuardianId);
    setError("");
    setSuccess("");
    try {
      await revokeGuardianAccount(id, revokeGuardianId);
      hideModal(revokeModalRef);
      setRevokeGuardianId(null);
      await fetchStudent();
      setSuccess("Guardian portal access revoked.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to revoke guardian access.");
      hideModal(revokeModalRef);
    } finally {
      setAccountLoading(null);
    }
  };

  // Status change
  const handleStatusChange = async () => {
    setStatusChanging(true);
    setError("");
    setSuccess("");
    try {
      await changeStudentStatus(id, statusForm);
      hideModal(statusModalRef);
      await fetchStudent();
      setSuccess(`Student status changed to ${statusForm.status.toLowerCase()}.`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to change student status.");
      hideModal(statusModalRef);
    } finally {
      setStatusChanging(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteStudent(id);
      hideModal(deleteModalRef);
      navigate("/admin/students/list");
    } catch {
      setError("Failed to delete student.");
      hideModal(deleteModalRef);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="mb-4">
          <h4 className="fw-bold mb-1" style={{ color: "var(--mk-blue)" }}>
            Student Details
          </h4>
        </div>
        <div className="text-center py-5">
          <span className="spinner-border text-primary" />
        </div>
      </div>
    );
  }

  if (error && !student) {
    return (
      <div>
        <div className="mb-4">
          <h4 className="fw-bold mb-1" style={{ color: "var(--mk-blue)" }}>
            Student Details
          </h4>
        </div>
        <div className="alert alert-danger">{error}</div>
        <button
          className="btn btn-outline-secondary rounded-3"
          onClick={() => navigate("/admin/students/list")}
        >
          &larr; Back to List
        </button>
      </div>
    );
  }

  if (!student) return null;

  const DetailField = ({ label, value }) => (
    <div className="col-md-6 col-lg-4 mb-3">
      <div className="student-detail-label">{label}</div>
      <div className="student-detail-value">{value || "\u2014"}</div>
    </div>
  );

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1" style={{ color: "var(--mk-blue)" }}>
          Student Details
        </h4>
        <p className="text-muted mb-0">{student.admissionNo}</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")} />
        </div>
      )}
      {success && (
        <div className="alert alert-success alert-dismissible fade show">
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess("")} />
        </div>
      )}

      {/* Photo + Name Header */}
      <div className="d-flex align-items-center gap-3 mb-4">
        {serverPhotoSrc ? (
          <img src={serverPhotoSrc} alt={student.fullName} className="student-photo-preview" />
        ) : (
          <div className="student-photo-placeholder">
            <span>&#128102;</span>
          </div>
        )}
        <div>
          <h4 className="fw-bold mb-1" style={{ color: "var(--mk-blue)" }}>
            {student.fullName}
          </h4>
          <div className="d-flex gap-2 flex-wrap">
            <span className={`badge ${STATUS_BADGE[student.status] || ""}`}>
              {student.status
                ? student.status.charAt(0) + student.status.slice(1).toLowerCase()
                : ""}
            </span>
            <span className="badge bg-secondary">{student.currentLevel}</span>
            <span className="badge bg-light text-dark border">{student.batchCode}</span>
          </div>
        </div>
      </div>

      {/* Student Information */}
      <div className="student-detail-section">
        <div className="student-form-section-title">Student Information</div>
        <div className="row">
          <DetailField label="Full Name" value={student.fullName} />
          <DetailField label="Admission No" value={student.admissionNo} />
          <DetailField label="Date of Birth" value={formatDate(student.dateOfBirth)} />
          <DetailField label="Gender" value={
            student.gender
              ? student.gender.charAt(0) + student.gender.slice(1).toLowerCase()
              : null
          } />
          <DetailField label="Entry Level" value={student.entryLevel} />
          <DetailField label="Current Level" value={student.currentLevel} />
          <DetailField label="Batch Code" value={student.batchCode} />
          <DetailField label="Entry Year" value={student.entryYear} />
          <DetailField label="Enrollment Date" value={formatDate(student.enrollmentDate)} />
          {student.leaveDate && (
            <DetailField label="Leave Date" value={formatDate(student.leaveDate)} />
          )}
        </div>
      </div>

      {/* Guardians */}
      <div className="student-detail-section">
        <div className="student-form-section-title">Guardians</div>
        {(student.guardians || []).map((g) => (
          <div key={g.id} className="guardian-card">
            <div className="guardian-card-header">
              <div>
                <strong>{g.fullName}</strong>
                <span className="badge bg-secondary ms-2">
                  {RELATION_LABEL[g.relationshipType] || g.relationshipType}
                </span>
                <span className={`badge ms-2 ${ACCOUNT_BADGE[g.accountStatus] || ""}`}>
                  {ACCOUNT_LABEL[g.accountStatus] || g.accountStatus}
                </span>
              </div>
              <div className="d-flex gap-1">
                {g.accountStatus === "NO_ACCOUNT" && g.email && student.status === "ACTIVE" && (
                  <button
                    className="btn btn-sm rounded-3"
                    style={{ background: "var(--mk-pink)", color: "#fff", border: "none" }}
                    onClick={() => handleCreateAccount(g.id)}
                    disabled={accountLoading === g.id}
                  >
                    {accountLoading === g.id && (
                      <span className="spinner-border spinner-border-sm me-1" />
                    )}
                    Create Account
                  </button>
                )}
                {g.accountStatus === "ACTIVE" && (
                  <button
                    className="btn btn-sm btn-warning rounded-3"
                    onClick={() => {
                      setRevokeGuardianId(g.id);
                      showModal(revokeModalRef);
                    }}
                    disabled={accountLoading === g.id}
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
            <div className="row mt-2">
              <div className="col-md-4">
                <small className="text-muted d-block">Email</small>
                <span style={{ fontSize: "0.9rem" }}>{g.email || "\u2014"}</span>
              </div>
              <div className="col-md-4">
                <small className="text-muted d-block">Phone</small>
                <span style={{ fontSize: "0.9rem" }}>{g.phone || "\u2014"}</span>
              </div>
              <div className="col-md-4">
                <small className="text-muted d-block">NIC</small>
                <span style={{ fontSize: "0.9rem" }}>{g.nic || "\u2014"}</span>
              </div>
              {g.address && (
                <div className="col-12 mt-1">
                  <small className="text-muted d-block">Address</small>
                  <span style={{ fontSize: "0.9rem" }}>{g.address}</span>
                </div>
              )}
              {g.accountEmail && (
                <div className="col-md-4 mt-1">
                  <small className="text-muted d-block">Account Email</small>
                  <span style={{ fontSize: "0.9rem" }}>{g.accountEmail}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      {student.notes && (
        <div className="student-detail-section">
          <div className="student-form-section-title">Notes</div>
          <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>{student.notes}</p>
        </div>
      )}

      {/* Audit */}
      <div className="student-detail-section">
        <div className="student-form-section-title">Audit Info</div>
        <div className="row">
          <DetailField label="Created At" value={formatDateTime(student.createdAt)} />
          <DetailField label="Last Updated" value={formatDateTime(student.updatedAt)} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="d-flex flex-wrap gap-2 mt-3">
        <button
          className="btn btn-primary rounded-3"
          onClick={() => navigate(`/admin/students/${id}/edit`)}
        >
          Edit Details
        </button>

        {student.status === "ACTIVE" && (
          <button
            type="button"
            className="btn btn-warning rounded-3"
            onClick={() => showModal(statusModalRef)}
          >
            Change Status
          </button>
        )}

        <button
          type="button"
          className="btn btn-outline-danger rounded-3"
          onClick={() => showModal(deleteModalRef)}
        >
          Delete Student
        </button>

        <button
          className="btn btn-outline-secondary rounded-3"
          onClick={() => navigate("/admin/students/list")}
        >
          &larr; Back to List
        </button>
      </div>

      {/* Status Change Modal */}
      <div className="modal fade" ref={statusModalRef} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4">
            <div className="modal-header border-0">
              <h5 className="modal-title fw-bold" style={{ color: "var(--mk-blue)" }}>
                Change Student Status
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <p className="text-muted small mb-3">
                This will change {student.fullName}'s status. Guardian portal accounts
                may be disabled if they have no other active students.
              </p>
              <div className="mb-3">
                <label className="form-label fw-semibold">New Status *</label>
                <select
                  className="form-select rounded-3"
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                >
                  <option value="WITHDRAWN">Withdrawn</option>
                  <option value="GRADUATED">Graduated</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Leave Date *</label>
                <input
                  type="date"
                  className="form-control rounded-3"
                  value={statusForm.leaveDate}
                  onChange={(e) => setStatusForm({ ...statusForm, leaveDate: e.target.value })}
                  required
                />
              </div>
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
                onClick={handleStatusChange}
                disabled={statusChanging || !statusForm.leaveDate}
              >
                {statusChanging && (
                  <span className="spinner-border spinner-border-sm me-2" />
                )}
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div className="modal fade" ref={deleteModalRef} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4">
            <div className="modal-header border-0">
              <h5 className="modal-title fw-bold" style={{ color: "var(--mk-blue)" }}>
                Confirm Delete
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete <strong>{student.fullName}</strong>'s
                record? This will soft-delete the student and may disable linked guardian
                portal accounts.
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

      {/* Revoke Guardian Account Modal */}
      <div className="modal fade" ref={revokeModalRef} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4">
            <div className="modal-header border-0">
              <h5 className="modal-title fw-bold" style={{ color: "var(--mk-blue)" }}>
                Revoke Guardian Access
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to revoke this guardian's portal login access?
                Their account will be disabled.
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
                disabled={accountLoading !== null}
              >
                {accountLoading !== null && (
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
