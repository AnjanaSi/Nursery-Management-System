import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpg";
import { getAdminsList, deleteAdmin } from "../services/api/adminsService";
import "./AdminPages.css";

const ADMIN_TYPES = [
  { value: "OWNER", label: "Owner" },
  { value: "FAMILY_MEMBER", label: "Family Member" },
  { value: "OTHER", label: "Other" },
];

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

const ADMIN_TYPE_LABEL = {
  OWNER: "Owner",
  FAMILY_MEMBER: "Family Member",
  OTHER: "Other",
};

export default function AdminsListPage() {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [search, setSearch] = useState("");
  const [adminTypeFilter, setAdminTypeFilter] = useState("");
  const [accountStatusFilter, setAccountStatusFilter] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const deleteModalRef = useRef(null);
  const deleteModalInstance = useRef(null);

  const fetchAdmins = useCallback(async (page = 0) => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminsList({
        search: search || undefined,
        adminType: adminTypeFilter || undefined,
        accountStatus: accountStatusFilter || undefined,
        page,
        size: 10,
      });
      const pageData = res.data;
      setAdmins(pageData.content || []);
      setTotalPages(pageData.totalPages || 0);
      setCurrentPage(pageData.number || 0);
    } catch {
      setError("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }, [search, adminTypeFilter, accountStatusFilter]);

  useEffect(() => {
    fetchAdmins(0);
  }, [fetchAdmins]);

  useEffect(() => {
    if (deleteModalRef.current) {
      deleteModalInstance.current = new window.bootstrap.Modal(deleteModalRef.current);
    }
    return () => deleteModalInstance.current?.dispose();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAdmins(0);
  };

  const handleClear = () => {
    setSearch("");
    setAdminTypeFilter("");
    setAccountStatusFilter("");
  };

  const openDeleteModal = (id) => {
    setDeleteId(id);
    deleteModalInstance.current?.show();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteAdmin(deleteId);
      deleteModalInstance.current?.hide();
      setDeleteId(null);
      fetchAdmins(currentPage);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete admin.");
      deleteModalInstance.current?.hide();
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    for (let i = 0; i < totalPages; i++) {
      if (i === 0 || i === totalPages - 1 || (i >= currentPage - 2 && i <= currentPage + 2)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== -1) {
        pages.push(-1);
      }
    }
    return (
      <nav className="d-flex justify-content-center mt-3">
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${currentPage === 0 ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => fetchAdmins(currentPage - 1)}>
              &laquo;
            </button>
          </li>
          {pages.map((p, idx) =>
            p === -1 ? (
              <li key={`e${idx}`} className="page-item disabled">
                <span className="page-link">&hellip;</span>
              </li>
            ) : (
              <li key={p} className={`page-item ${p === currentPage ? "active" : ""}`}>
                <button className="page-link" onClick={() => fetchAdmins(p)}>
                  {p + 1}
                </button>
              </li>
            )
          )}
          <li className={`page-item ${currentPage >= totalPages - 1 ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => fetchAdmins(currentPage + 1)}>
              &raquo;
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <div>
      <div className="admin-mgmt-header d-flex align-items-center gap-3">
        <img src={logo} alt="MerryKids" className="admin-mgmt-header-logo" />
        <div>
          <h5 className="fw-bold mb-0" style={{ color: "var(--mk-blue)" }}>
            Admin Directory
          </h5>
          <small className="text-muted">View and manage all admin profiles</small>
        </div>
      </div>

      {/* Search & Filters */}
      <form
        className="card border-0 shadow-sm rounded-4 p-3 mb-4"
        onSubmit={handleSearch}
      >
        <div className="row g-2 align-items-end">
          <div className="col-md-4">
            <label className="form-label small fw-semibold">Search</label>
            <input
              type="text"
              className="form-control form-control-sm rounded-3"
              placeholder="Name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-semibold">Account Status</label>
            <select
              className="form-select form-select-sm rounded-3"
              value={accountStatusFilter}
              onChange={(e) => setAccountStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="DISABLED">Disabled</option>
              <option value="NO_ACCOUNT">No Account</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-semibold">Type</label>
            <select
              className="form-select form-select-sm rounded-3"
              value={adminTypeFilter}
              onChange={(e) => setAdminTypeFilter(e.target.value)}
            >
              <option value="">All</option>
              {ADMIN_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="col-md-4 d-flex gap-2">
            <button type="submit" className="btn btn-primary btn-sm rounded-3">
              Search
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm rounded-3"
              onClick={handleClear}
            >
              Clear
            </button>
            <button
              type="button"
              className="btn btn-sm rounded-3 ms-auto"
              style={{ background: "var(--mk-pink)", color: "#fff", border: "none" }}
              onClick={() => navigate("/admin/admins/new")}
            >
              + Add Admin
            </button>
          </div>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="alert alert-danger alert-dismissible fade show">
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")} />
        </div>
      )}

      {/* Loading / Empty / Table */}
      {loading ? (
        <div className="text-center py-5">
          <span className="spinner-border text-primary" />
        </div>
      ) : admins.length === 0 ? (
        <div className="admin-empty-state">
          <div className="admin-empty-state-icon">🛡️</div>
          <h5>No Admins Found</h5>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover admin-table">
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th className="d-none d-lg-table-cell">Phone</th>
                  <th className="d-none d-md-table-cell">Type</th>
                  <th>Account</th>
                  <th className="d-none d-lg-table-cell">Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id}>
                    <td className="fw-semibold">{a.fullName}</td>
                    <td style={{ fontSize: "0.85rem" }}>{a.email}</td>
                    <td className="d-none d-lg-table-cell">{a.phoneNumber}</td>
                    <td className="d-none d-md-table-cell">
                      {ADMIN_TYPE_LABEL[a.adminType] || a.adminType || "—"}
                    </td>
                    <td>
                      <span className={`badge ${ACCOUNT_BADGE[a.accountStatus] || ""}`}>
                        {ACCOUNT_LABEL[a.accountStatus] || a.accountStatus}
                      </span>
                    </td>
                    <td className="d-none d-lg-table-cell" style={{ fontSize: "0.85rem" }}>
                      {formatDate(a.createdAt)}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-sm btn-outline-primary rounded-3"
                          onClick={() => navigate(`/admin/admins/${a.id}`)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger rounded-3"
                          onClick={() => openDeleteModal(a.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {renderPagination()}
        </>
      )}

      {/* Back Button */}
      <div className="mt-3">
        <button
          className="btn btn-outline-secondary rounded-3"
          onClick={() => navigate("/admin/admins")}
        >
          &larr; Back to Admin Management
        </button>
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
              <p className="admin-confirm-text">
                Are you sure you want to delete this admin record? This action will also
                disable any linked login access. The record will be soft-deleted.
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
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting && <span className="spinner-border spinner-border-sm me-2" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
