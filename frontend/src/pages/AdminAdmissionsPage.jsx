import { useState, useEffect, useCallback } from "react";
import {
  getAdminAnnouncement,
  getSubmissions,
  getSubmissionById,
} from "../services/api/admissionsService";
import AnnouncementForm from "../components/AnnouncementForm";
import SubmissionDetailModal from "../components/SubmissionDetailModal";
import "./AdminAdmissionsPage.css";

const STATUSES = [
  "RECEIVED",
  "UNDER_REVIEW",
  "INTERVIEW_REQUESTED",
  "INTERVIEW_SCHEDULED",
  "ON_HOLD",
  "ACCEPTED",
  "REJECTED_AFTER_REVIEW",
  "REJECTED_AFTER_INTERVIEW",
];

const LEVELS = ["LKG1", "UKG1", "UKG2"];

const STATUS_COLORS = {
  RECEIVED: "secondary",
  UNDER_REVIEW: "info",
  INTERVIEW_REQUESTED: "warning",
  INTERVIEW_SCHEDULED: "primary",
  ON_HOLD: "dark",
  ACCEPTED: "success",
  REJECTED_AFTER_REVIEW: "danger",
  REJECTED_AFTER_INTERVIEW: "danger",
};

function statusLabel(s) {
  return s.replace(/_/g, " ");
}

export default function AdminAdmissionsPage() {
  // Announcement
  const [announcement, setAnnouncement] = useState(null);
  const [loadingAnn, setLoadingAnn] = useState(true);
  const [showAnnForm, setShowAnnForm] = useState(false);

  // Submissions
  const [submissions, setSubmissions] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingSubs, setLoadingSubs] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  // Detail modal
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // Load announcement
  useEffect(() => {
    (async () => {
      try {
        const res = await getAdminAnnouncement();
        if (res.success) setAnnouncement(res.data);
      } catch {
        // No announcement yet
      } finally {
        setLoadingAnn(false);
      }
    })();
  }, []);

  // Load submissions
  const fetchSubmissions = useCallback(async (page = 0) => {
    setLoadingSubs(true);
    try {
      const res = await getSubmissions({
        search: search || undefined,
        status: statusFilter || undefined,
        level: levelFilter || undefined,
        page,
        size: 10,
      });
      if (res.success) {
        const data = res.data;
        setSubmissions(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
        setCurrentPage(data.number || 0);
      }
    } catch {
      setSubmissions([]);
    } finally {
      setLoadingSubs(false);
    }
  }, [search, statusFilter, levelFilter]);

  useEffect(() => {
    fetchSubmissions(0);
  }, [fetchSubmissions]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchSubmissions(0);
  };

  const handleViewDetail = async (id) => {
    try {
      const res = await getSubmissionById(id);
      if (res.success) {
        setSelectedSubmission(res.data);
        setShowDetail(true);
      }
    } catch {
      // ignore
    }
  };

  const handleSubmissionUpdated = (updated) => {
    setSelectedSubmission(updated);
    // Refresh table
    fetchSubmissions(currentPage);
  };

  return (
    <div>
      <h4 className="fw-bold mb-1" style={{ color: "var(--mk-blue)" }}>
        Admissions Management
      </h4>
      <p className="text-muted mb-4">
        Manage announcements and review admission applications
      </p>

      {/* ── Announcement Section ── */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <h5 className="fw-bold mb-0" style={{ color: "var(--mk-blue)" }}>
            Admission Announcement
          </h5>
          <button
            className="btn btn-primary btn-sm rounded-pill px-3"
            style={{ backgroundColor: "var(--mk-blue)", borderColor: "var(--mk-blue)" }}
            onClick={() => setShowAnnForm(true)}
          >
            {announcement ? "Edit" : "Create"}
          </button>
        </div>

        {loadingAnn ? (
          <div className="text-center py-3">
            <span className="spinner-border spinner-border-sm text-primary" />
          </div>
        ) : announcement ? (
          <div>
            <p className="mb-2">{announcement.message}</p>
            <div className="d-flex flex-wrap gap-2 mb-2">
              <span
                className={`badge rounded-pill ${announcement.open ? "bg-success" : "bg-secondary"}`}
              >
                {announcement.open ? "Open" : "Closed"}
              </span>
              <span className="badge rounded-pill" style={{ background: "var(--mk-blue-light)", color: "var(--mk-blue)" }}>
                {announcement.openDate} to {announcement.closeDate}
              </span>
              {announcement.hasApplicationPdf && (
                <span className="badge rounded-pill bg-light text-dark">
                  PDF: {announcement.applicationPdfOriginalName}
                </span>
              )}
            </div>
          </div>
        ) : (
          <p className="text-muted mb-0">
            No announcement yet. Create one to open admissions.
          </p>
        )}
      </div>

      {/* ── Filters ── */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
        <h5 className="fw-bold mb-3" style={{ color: "var(--mk-blue)" }}>
          Applications
          {totalElements > 0 && (
            <span className="badge bg-light text-muted ms-2" style={{ fontSize: "0.75rem" }}>
              {totalElements} total
            </span>
          )}
        </h5>

        <form className="row g-2 mb-3" onSubmit={handleSearch}>
          <div className="col-md-4">
            <input
              type="text"
              className="form-control form-control-sm rounded-3"
              placeholder="Search name, email, phone, ref..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select form-select-sm rounded-3"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-2">
            <select
              className="form-select form-select-sm rounded-3"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
            >
              <option value="">All Levels</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-3 d-flex gap-2">
            <button
              type="submit"
              className="btn btn-primary btn-sm rounded-pill px-3"
              style={{ backgroundColor: "var(--mk-blue)", borderColor: "var(--mk-blue)" }}
            >
              Search
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm rounded-pill px-3"
              onClick={() => {
                setSearch("");
                setStatusFilter("");
                setLevelFilter("");
              }}
            >
              Clear
            </button>
          </div>
        </form>

        {/* ── Table ── */}
        {loadingSubs ? (
          <div className="text-center py-4">
            <span className="spinner-border text-primary" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-4 text-muted">
            No applications found.
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead>
                  <tr className="text-muted small">
                    <th>Ref No</th>
                    <th>Date</th>
                    <th>Child</th>
                    <th>Level</th>
                    <th>Guardian</th>
                    <th className="d-none d-lg-table-cell">Email</th>
                    <th className="d-none d-lg-table-cell">Phone</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub.id}>
                      <td className="fw-semibold small">{sub.referenceNo}</td>
                      <td className="small">
                        {sub.submittedDate
                          ? new Date(sub.submittedDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td>{sub.childFullName}</td>
                      <td>
                        <span className="badge bg-light text-dark">{sub.levelApplyingFor}</span>
                      </td>
                      <td>{sub.guardianFullName}</td>
                      <td className="d-none d-lg-table-cell small">{sub.email}</td>
                      <td className="d-none d-lg-table-cell small">{sub.phone}</td>
                      <td>
                        <span
                          className={`badge bg-${STATUS_COLORS[sub.status] || "secondary"}`}
                          style={{ fontSize: "0.72rem" }}
                        >
                          {statusLabel(sub.status)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary rounded-pill px-3"
                          onClick={() => handleViewDetail(sub.id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="mt-3">
                <ul className="pagination pagination-sm justify-content-center mb-0">
                  <li className={`page-item ${currentPage === 0 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => fetchSubmissions(currentPage - 1)}
                    >
                      Previous
                    </button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => i)
                    .filter((p) => {
                      if (p === 0 || p === totalPages - 1) return true;
                      return Math.abs(p - currentPage) <= 2;
                    })
                    .flatMap((p, idx, arr) => {
                      const items = [];
                      if (idx > 0 && p - arr[idx - 1] > 1) {
                        items.push(
                          <li key={`ellipsis-${p}`} className="page-item disabled">
                            <span className="page-link">...</span>
                          </li>
                        );
                      }
                      items.push(
                        <li key={p} className={`page-item ${p === currentPage ? "active" : ""}`}>
                          <button
                            className="page-link"
                            onClick={() => fetchSubmissions(p)}
                          >
                            {p + 1}
                          </button>
                        </li>
                      );
                      return items;
                    })}
                  <li
                    className={`page-item ${currentPage === totalPages - 1 ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link"
                      onClick={() => fetchSubmissions(currentPage + 1)}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {showAnnForm && (
        <AnnouncementForm
          existing={announcement}
          onSaved={(data) => {
            setAnnouncement(data);
            setShowAnnForm(false);
          }}
          onClose={() => setShowAnnForm(false)}
        />
      )}

      {showDetail && selectedSubmission && (
        <SubmissionDetailModal
          submission={selectedSubmission}
          onClose={() => {
            setShowDetail(false);
            setSelectedSubmission(null);
          }}
          onUpdated={handleSubmissionUpdated}
        />
      )}
    </div>
  );
}
