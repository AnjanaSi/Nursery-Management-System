import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import StaffModuleHeader from "../components/StaffModuleHeader";
import { getStaffList, deleteStaff } from "../services/api/staffService";
import "./StaffPages.css";

const LEVELS = ["LKG1", "UKG1", "UKG2"];
const DESIGNATIONS = [
  { value: "ASSISTANT_TEACHER", label: "Assistant Teacher" },
  { value: "TEACHER", label: "Teacher" },
  { value: "SENIOR_TEACHER", label: "Senior Teacher" },
  { value: "PRINCIPAL", label: "Principal" },
];
const STATUSES = ["ACTIVE", "RESIGNED", "RETIRED", "TERMINATED"];

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

export default function StaffListPage() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const deleteModalRef = useRef(null);
  const deleteModalInstance = useRef(null);

  const fetchTeachers = useCallback(async (page = 0) => {
    setLoading(true);
    setError("");
    try {
      const res = await getStaffList({
        search: search || undefined,
        status: statusFilter || undefined,
        level: levelFilter || undefined,
        designation: designationFilter || undefined,
        page,
        size: 10,
      });
      const pageData = res.data;
      setTeachers(pageData.content || []);
      setTotalPages(pageData.totalPages || 0);
      setCurrentPage(pageData.number || 0);
    } catch {
      setError("Failed to load staff data.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, levelFilter, designationFilter]);

  useEffect(() => {
    fetchTeachers(0);
  }, [fetchTeachers]);

  useEffect(() => {
    if (deleteModalRef.current) {
      deleteModalInstance.current = new window.bootstrap.Modal(deleteModalRef.current);
    }
    return () => deleteModalInstance.current?.dispose();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTeachers(0);
  };

  const handleClear = () => {
    setSearch("");
    setStatusFilter("");
    setLevelFilter("");
    setDesignationFilter("");
  };

  const openDeleteModal = (id) => {
    setDeleteId(id);
    deleteModalInstance.current?.show();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteStaff(deleteId);
      deleteModalInstance.current?.hide();
      setDeleteId(null);
      fetchTeachers(currentPage);
    } catch {
      setError("Failed to delete teacher.");
      deleteModalInstance.current?.hide();
    } finally {
      setDeleting(false);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    for (let i = 0; i < totalPages; i++) {
      if (
        i === 0 ||
        i === totalPages - 1 ||
        (i >= currentPage - 2 && i <= currentPage + 2)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== -1) {
        pages.push(-1);
      }
    }

    return (
      <nav className="d-flex justify-content-center mt-3">
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${currentPage === 0 ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => fetchTeachers(currentPage - 1)}>
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
                <button className="page-link" onClick={() => fetchTeachers(p)}>
                  {p + 1}
                </button>
              </li>
            )
          )}
          <li className={`page-item ${currentPage >= totalPages - 1 ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => fetchTeachers(currentPage + 1)}>
              &raquo;
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <div>
      <StaffModuleHeader
        title="Staff Directory"
        subtitle="View and manage all staff records"
      />

      {/* Search & Filters */}
      <form
        className="card border-0 shadow-sm rounded-4 p-3 mb-4"
        onSubmit={handleSearch}
      >
        <div className="row g-2 align-items-end">
          <div className="col-md-3">
            <label className="form-label small fw-semibold">Search</label>
            <input
              type="text"
              className="form-control form-control-sm rounded-3"
              placeholder="Name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-semibold">Status</label>
            <select
              className="form-select form-select-sm rounded-3"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-semibold">Level</label>
            <select
              className="form-select form-select-sm rounded-3"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <option value="">All</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label small fw-semibold">Designation</label>
            <select
              className="form-select form-select-sm rounded-3"
              value={designationFilter}
              onChange={(e) => setDesignationFilter(e.target.value)}
            >
              <option value="">All</option>
              {DESIGNATIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3 d-flex gap-2">
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

      {/* Loading */}
      {loading ? (
        <div className="text-center py-5">
          <span className="spinner-border text-primary" />
        </div>
      ) : teachers.length === 0 ? (
        <div className="staff-empty-state">
          <div className="staff-empty-state-icon">&#128100;</div>
          <h5>No Staff Found</h5>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover staff-table">
              <thead>
                <tr>
                  <th>Emp. ID</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th className="d-none d-lg-table-cell">Phone</th>
                  <th>Level</th>
                  <th>Designation</th>
                  <th>Status</th>
                  <th>Account</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id}>
                    <td className="fw-semibold" style={{ fontSize: "0.85rem" }}>
                      {t.employmentId}
                    </td>
                    <td>{t.fullName}</td>
                    <td style={{ fontSize: "0.85rem" }}>{t.email}</td>
                    <td className="d-none d-lg-table-cell">{t.phoneNumber}</td>
                    <td>{t.levelAssigned}</td>
                    <td style={{ fontSize: "0.85rem" }}>
                      {DESIGNATION_LABEL[t.designation] || t.designation}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[t.employmentStatus] || ""}`}>
                        {t.employmentStatus
                          ? t.employmentStatus.charAt(0) + t.employmentStatus.slice(1).toLowerCase()
                          : ""}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${ACCOUNT_BADGE[t.accountStatus] || ""}`}>
                        {ACCOUNT_LABEL[t.accountStatus] || t.accountStatus}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-sm btn-outline-primary rounded-3"
                          onClick={() => navigate(`/admin/staff/${t.id}`)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger rounded-3"
                          onClick={() => openDeleteModal(t.id)}
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
          onClick={() => navigate("/admin/staff")}
        >
          &larr; Back to Staff Management
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
              <p className="staff-confirm-text">
                Are you sure you want to delete this staff record? This action will
                also revoke any linked login access. The record will be soft-deleted.
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
                {deleting ? (
                  <span className="spinner-border spinner-border-sm me-2" />
                ) : null}
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
