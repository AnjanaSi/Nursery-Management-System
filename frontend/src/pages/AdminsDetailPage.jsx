import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpg";
import {
  getAdminById,
  updateAdmin,
  deleteAdmin,
  createAdminAccount,
  disableAdminAccount,
} from "../services/api/adminsService";
import "./AdminPages.css";

const ADMIN_TYPES = [
  { value: "OWNER", label: "Owner" },
  { value: "FAMILY_MEMBER", label: "Family Member" },
  { value: "OTHER", label: "Other" },
];

const ADMIN_TYPE_LABEL = {
  OWNER: "Owner",
  FAMILY_MEMBER: "Family Member",
  OTHER: "Other",
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

const today = new Date().toISOString().split("T")[0];

export default function AdminsDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [validated, setValidated] = useState(false);

  // Account actions
  const [accountLoading, setAccountLoading] = useState(false);

  // Delete
  const [deleting, setDeleting] = useState(false);
  const deleteModalRef = useRef(null);

  // Disable account modal
  const disableModalRef = useRef(null);

  const fetchAdmin = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminById(id);
      setAdmin(res.data);
    } catch {
      setError("Failed to load admin details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAdmin();
  }, [fetchAdmin]);

  const startEdit = () => {
    setEditForm({
      fullName: admin.fullName || "",
      email: admin.email || "",
      phoneNumber: admin.phoneNumber || "",
      address: admin.address || "",
      nic: admin.nic || "",
      dateOfBirth: admin.dateOfBirth || "",
      adminType: admin.adminType || "",
      notes: admin.notes || "",
    });
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

  const handleSave = async (e) => {
    e.preventDefault();
    const formEl = e.target.closest("form");
    if (!formEl.checkValidity()) {
      setValidated(true);
      return;
    }

    const oldEmail = admin.email;
    const newEmail = editForm.email?.trim();
    const hasAccount = admin.accountStatus === "ACTIVE" || admin.accountStatus === "DISABLED";

    if (
      hasAccount &&
      newEmail &&
      oldEmail &&
      newEmail.toLowerCase() !== oldEmail.toLowerCase()
    ) {
      const ok = window.confirm(
        "This admin already has a portal login account.\n\n" +
          "Changing the email will also change their LOGIN email (password stays the same).\n\n" +
          "Do you want to continue?"
      );
      if (!ok) {
        setEditing(false);
        return;
      }
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const data = { ...editForm };
      if (!data.adminType) delete data.adminType;
      if (!data.dateOfBirth) delete data.dateOfBirth;
      if (!data.address) delete data.address;
      if (!data.nic) delete data.nic;
      if (!data.notes) data.notes = "";

      const res = await updateAdmin(id, data);
      setAdmin(res.data);
      setEditing(false);
      setSuccess("Admin details updated successfully!");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update admin.");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAccount = async () => {
    setAccountLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await createAdminAccount(id);
      setAdmin(res.data);
      setSuccess("Login account created successfully! A welcome email has been sent.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create login account.");
    } finally {
      setAccountLoading(false);
    }
  };

  const handleDisableAccount = async () => {
    setAccountLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await disableAdminAccount(id);
      setAdmin(res.data);
      hideDisableModal();
      setSuccess("Login access disabled successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to disable login access.");
      hideDisableModal();
    } finally {
      setAccountLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAdmin(id);
      hideDeleteModal();
      navigate("/admin/admins/list");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete admin.");
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

  const showDisableModal = () => {
    const el = disableModalRef.current;
    if (!el) return;
    window.bootstrap.Modal.getOrCreateInstance(el).show();
  };

  const hideDeleteModal = () => {
    const el = deleteModalRef.current;
    if (!el) return;
    window.bootstrap.Modal.getInstance(el)?.hide();
  };

  const hideDisableModal = () => {
    const el = disableModalRef.current;
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

  const Header = () => (
    <div className="admin-mgmt-header d-flex align-items-center gap-3">
      <img src={logo} alt="MerryKids" className="admin-mgmt-header-logo" />
      <div>
        <h5 className="fw-bold mb-0" style={{ color: "var(--mk-blue)" }}>
          Admin Details
        </h5>
        <small className="text-muted">{admin?.fullName || "Loading..."}</small>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div>
        <Header />
        <div className="text-center py-5">
          <span className="spinner-border text-primary" />
        </div>
      </div>
    );
  }

  if (error && !admin) {
    return (
      <div>
        <Header />
        <div className="alert alert-danger">{error}</div>
        <button
          className="btn btn-outline-secondary rounded-3"
          onClick={() => navigate("/admin/admins/list")}
        >
          &larr; Back to List
        </button>
      </div>
    );
  }

  if (!admin) return null;

  const DetailField = ({ label, value }) => (
    <div className="col-md-6 col-lg-4 mb-3">
      <div className="admin-detail-label">{label}</div>
      <div className="admin-detail-value">{value || "—"}</div>
    </div>
  );

  return (
    <div>
      <Header />

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

      {!editing ? (
        /* ── READ-ONLY VIEW ── */
        <>
          {/* Name + Account status header */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <div
              style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "var(--mk-surface, #F8FAFC)",
                border: "3px solid var(--mk-blue-light, #DBEAFE)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.8rem",
              }}
            >
              🛡️
            </div>
            <div>
              <h4 className="fw-bold mb-1" style={{ color: "var(--mk-blue)" }}>
                {admin.fullName}
              </h4>
              <div className="d-flex gap-2 flex-wrap">
                {admin.adminType && (
                  <span className="badge bg-light text-dark border" style={{ fontSize: "0.8rem" }}>
                    {ADMIN_TYPE_LABEL[admin.adminType] || admin.adminType}
                  </span>
                )}
                <span className={`badge ${ACCOUNT_BADGE[admin.accountStatus] || ""}`}>
                  {ACCOUNT_LABEL[admin.accountStatus] || admin.accountStatus}
                </span>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="admin-detail-section">
            <div className="admin-form-section-title">Personal Information</div>
            <div className="row">
              <DetailField label="Full Name" value={admin.fullName} />
              <DetailField label="Email" value={admin.email} />
              <DetailField label="Phone Number" value={admin.phoneNumber} />
              <DetailField label="Date of Birth" value={formatDate(admin.dateOfBirth)} />
              <DetailField label="NIC / National ID" value={admin.nic} />
              <DetailField label="Address" value={admin.address} />
            </div>
          </div>

          {/* Role / Relationship */}
          <div className="admin-detail-section">
            <div className="admin-form-section-title">Role / Relationship</div>
            <div className="row">
              <DetailField
                label="Admin Type"
                value={ADMIN_TYPE_LABEL[admin.adminType] || admin.adminType}
              />
              {admin.notes && (
                <div className="col-12 mb-3">
                  <div className="admin-detail-label">Notes</div>
                  <div className="admin-detail-value" style={{ whiteSpace: "pre-wrap" }}>
                    {admin.notes}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Portal Account */}
          <div className="admin-detail-section">
            <div className="admin-form-section-title">Portal Account</div>
            <div className="row">
              <DetailField
                label="Account Status"
                value={ACCOUNT_LABEL[admin.accountStatus] || admin.accountStatus}
              />
              {admin.accountEmail && (
                <DetailField label="Login Email" value={admin.accountEmail} />
              )}
            </div>
          </div>

          {/* Audit */}
          <div className="admin-detail-section">
            <div className="admin-form-section-title">Audit Info</div>
            <div className="row">
              <DetailField label="Created At" value={formatDateTime(admin.createdAt)} />
              <DetailField label="Last Updated" value={formatDateTime(admin.updatedAt)} />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="d-flex flex-wrap gap-2 mt-3">
            <button
              className="btn btn-primary rounded-3 admin-action-btn"
              onClick={startEdit}
            >
              Edit Details
            </button>

            {(admin.accountStatus === "NO_ACCOUNT" || admin.accountStatus === "DISABLED") && (
              <button
                className="btn rounded-3 admin-action-btn"
                style={{ background: "var(--mk-pink)", color: "#fff", border: "none" }}
                onClick={handleCreateAccount}
                disabled={accountLoading}
              >
                {accountLoading && <span className="spinner-border spinner-border-sm me-2" />}
                Create Login Account
              </button>
            )}

            {admin.accountStatus === "ACTIVE" && (
              <button
                type="button"
                className="btn btn-warning rounded-3 admin-action-btn"
                onClick={showDisableModal}
                disabled={accountLoading}
              >
                Disable Login Access
              </button>
            )}

            <button
              type="button"
              className="btn btn-outline-danger rounded-3 admin-action-btn"
              onClick={showDeleteModal}
            >
              Delete Admin Record
            </button>

            <button
              className="btn btn-outline-secondary rounded-3 admin-action-btn"
              onClick={() => navigate("/admin/admins/list")}
            >
              &larr; Back to List
            </button>
          </div>
        </>
      ) : (
        /* ── EDIT MODE ── */
        <form noValidate className={validated ? "was-validated" : ""}>
          <div className="admin-form-section">
            <div className="admin-form-section-title">Personal Information</div>
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
              <div className="col-md-6">
                <label className="form-label">Date of Birth</label>
                <input
                  type="date"
                  className="form-control rounded-3"
                  name="dateOfBirth"
                  value={editForm.dateOfBirth}
                  onChange={handleEditChange}
                  max={today}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">NIC / National ID</label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  name="nic"
                  value={editForm.nic}
                  onChange={handleEditChange}
                />
              </div>
              <div className="col-12">
                <label className="form-label">Address</label>
                <textarea
                  className="form-control rounded-3"
                  name="address"
                  value={editForm.address}
                  onChange={handleEditChange}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div className="admin-form-section">
            <div className="admin-form-section-title">Role / Relationship</div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Admin Type</label>
                <select
                  className="form-select rounded-3"
                  name="adminType"
                  value={editForm.adminType}
                  onChange={handleEditChange}
                >
                  <option value="">-- Select --</option>
                  {ADMIN_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="admin-form-section">
            <div className="admin-form-section-title">Notes</div>
            <textarea
              className="form-control rounded-3"
              name="notes"
              value={editForm.notes}
              onChange={handleEditChange}
              rows={3}
            />
          </div>

          <div className="d-flex flex-wrap gap-2 mt-3">
            <button
              type="submit"
              className="btn btn-primary rounded-3 admin-action-btn"
              disabled={saving}
              onClick={handleSave}
            >
              {saving && <span className="spinner-border spinner-border-sm me-2" />}
              Save Changes
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary rounded-3 admin-action-btn"
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
              <h5 className="modal-title fw-bold" style={{ color: "var(--mk-blue)" }}>
                Confirm Delete
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <p className="admin-confirm-text">
                Are you sure you want to delete <strong>{admin.fullName}</strong>'s record?
                This will also disable any linked login access.
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
                {deleting && <span className="spinner-border spinner-border-sm me-2" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Disable Account Modal */}
      <div className="modal fade" ref={disableModalRef} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4">
            <div className="modal-header border-0">
              <h5 className="modal-title fw-bold" style={{ color: "var(--mk-blue)" }}>
                Disable Login Access
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <p className="admin-confirm-text">
                Are you sure you want to disable login access for{" "}
                <strong>{admin.fullName}</strong>? Their account will be deactivated.
                The account can be re-provisioned later.
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
                onClick={handleDisableAccount}
                disabled={accountLoading}
              >
                {accountLoading && <span className="spinner-border spinner-border-sm me-2" />}
                Disable Access
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
