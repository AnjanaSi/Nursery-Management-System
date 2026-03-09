import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getStudents, deleteStudent } from "../services/api/studentsApi";
import "./StudentPages.css";

const LEVELS = ["LKG1", "UKG1", "UKG2"];
const STATUSES = ["ACTIVE", "WITHDRAWN", "GRADUATED"];

const STATUS_BADGE = {
  ACTIVE: "badge-student-active",
  WITHDRAWN: "badge-student-withdrawn",
  GRADUATED: "badge-student-graduated",
};

export default function StudentsListPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ACTIVE");
  const [levelFilter, setLevelFilter] = useState("");
  const [batchCodeFilter, setBatchCodeFilter] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const deleteModalRef = useRef(null);
  const deleteModalInstance = useRef(null);

  const fetchStudents = useCallback(async (page = 0) => {
    setLoading(true);
    setError("");
    try {
      const res = await getStudents({
        search: search || undefined,
        status: statusFilter || undefined,
        level: levelFilter || undefined,
        batchCode: batchCodeFilter || undefined,
        page,
        size: 10,
      });
      const pageData = res.data;
      setStudents(pageData.content || []);
      setTotalPages(pageData.totalPages || 0);
      setCurrentPage(pageData.number || 0);
    } catch {
      setError("Failed to load student data.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, levelFilter, batchCodeFilter]);

  useEffect(() => {
    fetchStudents(0);
  }, [fetchStudents]);

  useEffect(() => {
    if (deleteModalRef.current) {
      deleteModalInstance.current = new window.bootstrap.Modal(deleteModalRef.current);
    }
    return () => deleteModalInstance.current?.dispose();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchStudents(0);
  };

  const handleClear = () => {
    setSearch("");
    setStatusFilter("ACTIVE");
    setLevelFilter("");
    setBatchCodeFilter("");
  };

  const openDeleteModal = (id) => {
    setDeleteId(id);
    deleteModalInstance.current?.show();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteStudent(deleteId);
      deleteModalInstance.current?.hide();
      setDeleteId(null);
      fetchStudents(currentPage);
    } catch {
      setError("Failed to delete student.");
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
            <button className="page-link" onClick={() => fetchStudents(currentPage - 1)}>
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
                <button className="page-link" onClick={() => fetchStudents(p)}>
                  {p + 1}
                </button>
              </li>
            )
          )}
          <li className={`page-item ${currentPage >= totalPages - 1 ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => fetchStudents(currentPage + 1)}>
              &raquo;
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1" style={{ color: "var(--mk-blue)" }}>
          Student Directory
        </h4>
        <p className="text-muted mb-0">View and manage all student records</p>
      </div>

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
              placeholder="Name, admission no, guardian..."
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
            <label className="form-label small fw-semibold">Batch Code</label>
            <input
              type="text"
              className="form-control form-control-sm rounded-3"
              placeholder="e.g. 26LKG1"
              value={batchCodeFilter}
              onChange={(e) => setBatchCodeFilter(e.target.value)}
            />
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

      {/* Loading / Table */}
      {loading ? (
        <div className="text-center py-5">
          <span className="spinner-border text-primary" />
        </div>
      ) : students.length === 0 ? (
        <div className="student-empty-state">
          <div className="student-empty-state-icon">&#128102;</div>
          <h5>No Students Found</h5>
          <p>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover student-table">
              <thead>
                <tr>
                  <th>Adm. No</th>
                  <th>Full Name</th>
                  <th>Level</th>
                  <th>Batch</th>
                  <th>Status</th>
                  <th className="d-none d-lg-table-cell">Guardian(s)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="fw-semibold" style={{ fontSize: "0.85rem" }}>
                      {s.admissionNo}
                    </td>
                    <td>{s.fullName}</td>
                    <td>{s.currentLevel}</td>
                    <td style={{ fontSize: "0.85rem" }}>{s.batchCode}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[s.status] || ""}`}>
                        {s.status
                          ? s.status.charAt(0) + s.status.slice(1).toLowerCase()
                          : ""}
                      </span>
                    </td>
                    <td className="d-none d-lg-table-cell" style={{ fontSize: "0.85rem" }}>
                      {s.guardianNames || "—"}
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <button
                          className="btn btn-sm btn-outline-primary rounded-3"
                          onClick={() => navigate(`/admin/students/${s.id}`)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger rounded-3"
                          onClick={() => openDeleteModal(s.id)}
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
          onClick={() => navigate("/admin/students")}
        >
          &larr; Back to Student Management
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
              <p>
                Are you sure you want to delete this student record? This action will
                soft-delete the student and may disable linked guardian portal accounts
                if they have no other active students.
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
