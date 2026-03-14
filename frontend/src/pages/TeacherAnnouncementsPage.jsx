import { useState, useEffect, useCallback, useRef } from "react";
import {
  listContent,
  createContent,
  getContentById,
  updateContent,
  deleteContent,
  archiveYear,
  downloadAttachment,
  getCurrentAcademicYear,
  formatDateTime,
} from "../services/api/teacherService";
import "./TeacherAnnouncementsPage.css";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ─── Content Form Modal ────────────────────────────────────────────────────

function ContentFormModal({ modalRef, editTarget, onSaved }) {
  const [form, setForm] = useState({ title: "", body: "", pinned: false, urgent: false });
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [keepIds, setKeepIds] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [fileError, setFileError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editTarget) {
      setForm({
        title: editTarget.title || "",
        body: editTarget.body || "",
        pinned: editTarget.pinned || false,
        urgent: editTarget.urgent || false,
      });
      setExistingAttachments(editTarget.attachments || []);
      setKeepIds((editTarget.attachments || []).map((a) => a.id));
    } else {
      setForm({ title: "", body: "", pinned: false, urgent: false });
      setExistingAttachments([]);
      setKeepIds([]);
    }
    setNewFiles([]);
    setFileError("");
    setError("");
  }, [editTarget]);

  const handleFileAdd = (e) => {
    setFileError("");
    const files = Array.from(e.target.files);
    for (const f of files) {
      if (!ALLOWED_TYPES.includes(f.type)) {
        setFileError("Unsupported file type. Allowed: PDF, JPG, PNG, WEBP, DOCX.");
        e.target.value = "";
        return;
      }
      if (f.size > MAX_FILE_SIZE) {
        setFileError("Each file must be under 10 MB.");
        e.target.value = "";
        return;
      }
    }
    setNewFiles((prev) => [...prev, ...files]);
    e.target.value = "";
  };

  const removeNewFile = (idx) =>
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));

  const toggleKeep = (id) =>
    setKeepIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setError("Title and body are required.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payload = { ...form, keepAttachmentIds: keepIds };
      if (editTarget) {
        await updateContent("announcements", editTarget.id, payload, newFiles);
      } else {
        await createContent("announcements", payload, newFiles);
      }
      onSaved();
      closeModal();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save announcement.");
    } finally {
      setSubmitting(false);
    }
  };

  const closeModal = () => {
    const el = modalRef.current;
    if (el) window.bootstrap?.Modal?.getInstance(el)?.hide();
  };

  return (
    <div className="modal fade" tabIndex={-1} ref={modalRef}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">
              {editTarget ? "Edit Announcement" : "New Announcement"}
            </h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="alert alert-danger py-2">{error}</div>}

              <div className="mb-3">
                <label className="form-label fw-semibold">Title <span className="text-danger">*</span></label>
                <input
                  className="form-control"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Announcement title"
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Body <span className="text-danger">*</span></label>
                <textarea
                  className="form-control"
                  rows={6}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Write your announcement here..."
                  required
                />
              </div>

              <div className="d-flex gap-4 mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="chk-pinned"
                    checked={form.pinned}
                    onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="chk-pinned">
                    Pin to top
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="chk-urgent"
                    checked={form.urgent}
                    onChange={(e) => setForm({ ...form, urgent: e.target.checked })}
                  />
                  <label className="form-check-label" htmlFor="chk-urgent">
                    Mark as urgent
                  </label>
                </div>
              </div>

              {/* Existing attachments (edit mode) */}
              {existingAttachments.length > 0 && (
                <div className="mb-3">
                  <label className="form-label fw-semibold">Current Attachments</label>
                  <div className="tc-attachment-list">
                    {existingAttachments.map((att) => (
                      <div key={att.id} className="tc-attachment-row">
                        <input
                          type="checkbox"
                          className="form-check-input me-2"
                          checked={keepIds.includes(att.id)}
                          onChange={() => toggleKeep(att.id)}
                          id={`keep-${att.id}`}
                        />
                        <label htmlFor={`keep-${att.id}`} className="small mb-0">
                          {att.originalFileName}
                          <span className="text-muted ms-1">
                            ({(att.sizeBytes / 1024).toFixed(1)} KB)
                          </span>
                        </label>
                      </div>
                    ))}
                    <p className="text-muted small mt-1 mb-0">
                      Uncheck to remove an attachment on save.
                    </p>
                  </div>
                </div>
              )}

              {/* New file upload */}
              <div className="mb-3">
                <label className="form-label fw-semibold">Add Attachments</label>
                <input
                  type="file"
                  className="form-control"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.docx"
                  multiple
                  onChange={handleFileAdd}
                />
                {fileError && <div className="text-danger small mt-1">{fileError}</div>}
                <div className="text-muted small mt-1">
                  PDF, JPG, PNG, WEBP, DOCX — max 10 MB each
                </div>
                {newFiles.length > 0 && (
                  <ul className="list-unstyled mt-2 mb-0">
                    {newFiles.map((f, i) => (
                      <li key={i} className="d-flex align-items-center gap-2 small">
                        <span>{f.name}</span>
                        <button
                          type="button"
                          className="btn btn-link btn-sm text-danger p-0"
                          onClick={() => removeNewFile(i)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? (
                  <><span className="spinner-border spinner-border-sm me-2" />Saving…</>
                ) : (
                  editTarget ? "Save Changes" : "Post Announcement"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Content Detail Modal ──────────────────────────────────────────────────

function ContentDetailModal({ modalRef, item, onEdit, onDeleted, onUnarchived }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [unarchiving, setUnarchiving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setConfirmDelete(false);
    setError("");
  }, [item]);

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await deleteContent("announcements", item.id);
      closeModal();
      onDeleted(item.id);
    } catch (err) {
      setError(err.response?.data?.error || "Delete failed.");
    } finally {
      setDeleting(false);
    }
  };

  const handleUnarchive = async () => {
    setUnarchiving(true);
    try {
      const payload = {
        title: item.title,
        body: item.body,
        pinned: item.pinned,
        urgent: item.urgent,
        archived: false,
        keepAttachmentIds: (item.attachments || []).map((a) => a.id),
      };
      await updateContent("announcements", item.id, payload, []);
      closeModal();
      onUnarchived(item.id);
    } catch (err) {
      setError(err.response?.data?.error || "Unarchive failed.");
    } finally {
      setUnarchiving(false);
    }
  };

  const closeModal = () => {
    const el = modalRef.current;
    if (el) window.bootstrap?.Modal?.getInstance(el)?.hide();
  };

  const showUpdated = item && item.updatedAt && item.updatedAt !== item.createdAt;

  return (
    <div className="modal fade" tabIndex={-1} ref={modalRef}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          {!item ? (
            <>
              <div className="modal-header">
                <h5 className="modal-title fw-semibold text-muted">Loading…</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" />
              </div>
              <div className="modal-body text-center py-5">
                <span className="spinner-border text-primary" />
              </div>
            </>
          ) : (
            <>
              <div className="modal-header align-items-start">
                <div>
                  <h5 className="modal-title fw-bold mb-1">{item.title}</h5>
                  <div className="d-flex flex-wrap gap-1">
                    {item.pinned && (
                      <span className="badge tc-badge-pinned">Pinned</span>
                    )}
                    {item.urgent && (
                      <span className="badge tc-badge-urgent">Urgent</span>
                    )}
                    {item.archived && (
                      <span className="badge bg-secondary">Archived</span>
                    )}
                  </div>
                </div>
                <button type="button" className="btn-close ms-auto" data-bs-dismiss="modal" />
              </div>

              <div className="modal-body">
                {error && <div className="alert alert-danger py-2">{error}</div>}

                <div className="tc-detail-meta mb-3">
                  <span>Level: <strong>{item.targetLevel}</strong></span>
                  <span className="tc-meta-sep">·</span>
                  <span>Year: <strong>{item.academicYear}</strong></span>
                  <span className="tc-meta-sep">·</span>
                  <span>Posted: <strong>{formatDateTime(item.createdAt)}</strong></span>
                  {showUpdated && (
                    <>
                      <span className="tc-meta-sep">·</span>
                      <span>Updated: <strong>{formatDateTime(item.updatedAt)}</strong></span>
                    </>
                  )}
                  {item.createdByTeacherName && (
                    <>
                      <span className="tc-meta-sep">·</span>
                      <span>By: <strong>{item.createdByTeacherName}</strong></span>
                    </>
                  )}
                </div>

                <div className="tc-detail-body">{item.body}</div>

                {item.attachments && item.attachments.length > 0 && (
                  <div className="mt-3">
                    <p className="fw-semibold mb-2 small">Attachments</p>
                    <div className="tc-attachment-list">
                      {item.attachments.map((att) => (
                        <div key={att.id} className="tc-attachment-row justify-content-between">
                          <span className="small">{att.originalFileName}</span>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => downloadAttachment(att.id, att.originalFileName)}
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer justify-content-between">
                <div className="d-flex gap-2">
                  {!item.archived && (
                    <>
                      <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => { closeModal(); onEdit(item); }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{ background: confirmDelete ? "#dc3545" : "", color: confirmDelete ? "#fff" : "", borderColor: "#dc3545" }}
                        onClick={handleDelete}
                        disabled={deleting}
                      >
                        {deleting
                          ? <><span className="spinner-border spinner-border-sm me-1" />Deleting…</>
                          : confirmDelete
                            ? "Confirm Delete"
                            : "Delete"}
                      </button>
                      {confirmDelete && (
                        <button className="btn btn-sm btn-secondary" onClick={() => setConfirmDelete(false)}>
                          Cancel
                        </button>
                      )}
                    </>
                  )}
                  {item.archived && (
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={handleUnarchive}
                      disabled={unarchiving}
                    >
                      {unarchiving
                        ? <><span className="spinner-border spinner-border-sm me-1" />Unarchiving…</>
                        : "Unarchive"}
                    </button>
                  )}
                </div>
                <button type="button" className="btn btn-secondary btn-sm" data-bs-dismiss="modal">
                  Close
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Archive Year Modal ────────────────────────────────────────────────────

function ArchiveYearModal({ modalRef, levelName, onArchived }) {
  const [year, setYear] = useState(getCurrentAcademicYear());
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setYear(getCurrentAcademicYear());
    setError("");
  }, []);

  const handleArchive = async () => {
    if (!year) return;
    setArchiving(true);
    setError("");
    try {
      await archiveYear("announcements", year);
      const el = modalRef.current;
      if (el) window.bootstrap?.Modal?.getInstance(el)?.hide();
      onArchived();
    } catch (err) {
      setError(err.response?.data?.error || "Archive failed.");
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="modal fade" tabIndex={-1} ref={modalRef}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">Archive Announcements by Year</h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" />
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <div className="mb-3">
              <label className="form-label fw-semibold">Academic Year</label>
              <input
                className="form-control"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="e.g. 2025/2026"
              />
            </div>
            <div className="alert alert-warning py-2 mb-0">
              <strong>Warning:</strong> This will archive <strong>all</strong> announcements for{" "}
              <strong>{levelName}</strong> in <strong>{year || "the selected year"}</strong>. Archived items
              are hidden from parents but remain visible to teachers under the Archived filter. This action
              affects multiple posts at once.
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={handleArchive}
              disabled={archiving || !year}
            >
              {archiving
                ? <><span className="spinner-border spinner-border-sm me-2" />Archiving…</>
                : "Archive Year"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function TeacherAnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [archivedFilter, setArchivedFilter] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [levelName, setLevelName] = useState("");

  const [editTarget, setEditTarget] = useState(null);
  const [detailItem, setDetailItem] = useState(null);

  const formModalRef = useRef(null);
  const detailModalRef = useRef(null);
  const archiveModalRef = useRef(null);

  const fetchItems = useCallback(async (pg = 0) => {
    setLoading(true);
    setError("");
    try {
      const res = await listContent("announcements", { archived: archivedFilter, page: pg, size: 10 });
      const { content, totalPages: tp, number } = res.data.data;
      setItems(content);
      setTotalPages(tp);
      setPage(number);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  }, [archivedFilter]);

  useEffect(() => { fetchItems(0); }, [fetchItems]);

  // Retrieve level from first item or from profile (simpler: read from first item loaded)
  useEffect(() => {
    if (items.length > 0 && items[0].targetLevel) setLevelName(items[0].targetLevel);
  }, [items]);

  const openFormModal = (target = null) => {
    setEditTarget(target);
    const el = formModalRef.current;
    if (el) window.bootstrap.Modal.getOrCreateInstance(el).show();
  };

  const openDetailModal = async (id) => {
    setDetailItem(null);
    const el = detailModalRef.current;
    if (el) window.bootstrap.Modal.getOrCreateInstance(el).show();
    try {
      const res = await getContentById("announcements", id);
      setDetailItem(res.data.data);
    } catch {
      setError("Failed to load announcement details.");
      if (el) window.bootstrap.Modal.getOrCreateInstance(el).hide();
    }
  };

  const openArchiveModal = () => {
    const el = archiveModalRef.current;
    if (el) window.bootstrap.Modal.getOrCreateInstance(el).show();
  };

  const handleSaved = () => fetchItems(0);

  const handleDeleted = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUnarchived = () => {
    fetchItems(page);
  };

  const handleFilterChange = (archived) => {
    if (archived === archivedFilter) return;
    setArchivedFilter(archived);
    setPage(0);
  };

  return (
    <div className="tc-page">
      <div className="tc-page-header">
        <div>
          <h2 className="tc-page-title">Announcements</h2>
          <p className="tc-page-subtitle">
            Manage announcements for your class
          </p>
        </div>
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-outline-secondary btn-sm" onClick={openArchiveModal}>
            Archive Year
          </button>
          <button className="btn btn-primary" onClick={() => openFormModal(null)}>
            + New Announcement
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="tc-filter-tabs mb-3">
        <button
          className={`tc-filter-tab ${!archivedFilter ? "active" : ""}`}
          onClick={() => handleFilterChange(false)}
        >
          Active
        </button>
        <button
          className={`tc-filter-tab ${archivedFilter ? "active" : ""}`}
          onClick={() => handleFilterChange(true)}
        >
          Archived
        </button>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible">
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")} />
        </div>
      )}

      {loading ? (
        <div className="tc-spinner-wrap">
          <span className="spinner-border text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="tc-empty-state">
          <div className="tc-empty-icon">📢</div>
          <h5>No {archivedFilter ? "archived" : "active"} announcements</h5>
          <p className="text-muted">
            {archivedFilter
              ? "No announcements have been archived yet."
              : "Create your first announcement using the button above."}
          </p>
        </div>
      ) : (
        <>
          <div className="tc-card-grid">
            {items.map((item) => (
              <div
                key={item.id}
                className={`tc-card ${item.pinned ? "tc-card-pinned" : ""}`}
                onClick={() => openDetailModal(item.id)}
              >
                <div className="tc-card-badges">
                  {item.pinned && <span className="badge tc-badge-pinned">Pinned</span>}
                  {item.urgent && <span className="badge tc-badge-urgent">Urgent</span>}
                  {item.archived && <span className="badge bg-secondary">Archived</span>}
                </div>
                <h6 className="tc-card-title">{item.title}</h6>
                <p className="tc-card-excerpt">{item.bodyExcerpt}</p>
                <div className="tc-card-footer">
                  <span className="tc-card-date">{formatDateTime(item.createdAt)}</span>
                  {item.updatedAt !== item.createdAt && (
                    <span className="tc-card-updated">Updated {formatDateTime(item.updatedAt)}</span>
                  )}
                  {item.attachmentCount > 0 && (
                    <span className="tc-card-attachments">
                      📎 {item.attachmentCount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <nav className="d-flex justify-content-center mt-4">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${page === 0 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => fetchItems(page - 1)}>
                    &laquo;
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => (
                  <li key={i} className={`page-item ${page === i ? "active" : ""}`}>
                    <button className="page-link" onClick={() => fetchItems(i)}>
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${page >= totalPages - 1 ? "disabled" : ""}`}>
                  <button className="page-link" onClick={() => fetchItems(page + 1)}>
                    &raquo;
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </>
      )}

      <ContentFormModal
        modalRef={formModalRef}
        editTarget={editTarget}
        onSaved={handleSaved}
      />
      <ContentDetailModal
        modalRef={detailModalRef}
        item={detailItem}
        onEdit={(item) => openFormModal(item)}
        onDeleted={handleDeleted}
        onUnarchived={handleUnarchived}
      />
      <ArchiveYearModal
        modalRef={archiveModalRef}
        levelName={levelName}
        onArchived={() => fetchItems(0)}
      />
    </div>
  );
}
