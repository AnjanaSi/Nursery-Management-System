import { useState, useEffect, useCallback, useRef } from "react";
import {
  getChildren,
  listAnnouncements,
  getAnnouncementDetail,
  markAnnouncementViewed,
  downloadAttachment,
  formatDateTime,
  formatDate,
} from "../services/api/parentService";
import "./ParentAnnouncementsPage.css";

// ─── Detail Modal ───────────────────────────────────────────────────────────

function AnnouncementDetailModal({ modalRef, item, selectedChildId, onViewed }) {
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
                    {item.pinned && <span className="badge pp-badge-pinned">Pinned</span>}
                    {item.urgent && <span className="badge pp-badge-urgent">Urgent</span>}
                  </div>
                </div>
                <button type="button" className="btn-close ms-auto" data-bs-dismiss="modal" />
              </div>

              <div className="modal-body">
                <div className="pp-detail-meta mb-3">
                  <span>Level: <strong>{item.targetLevel}</strong></span>
                  <span className="pp-meta-sep">·</span>
                  <span>Posted: <strong>{formatDateTime(item.createdAt)}</strong></span>
                  {showUpdated && (
                    <>
                      <span className="pp-meta-sep">·</span>
                      <span>Updated: <strong>{formatDateTime(item.updatedAt)}</strong></span>
                    </>
                  )}
                  {item.createdByTeacherName && (
                    <>
                      <span className="pp-meta-sep">·</span>
                      <span>By: <strong>{item.createdByTeacherName}</strong></span>
                    </>
                  )}
                </div>

                <div className="pp-detail-body">{item.body}</div>

                {item.attachments && item.attachments.length > 0 && (
                  <div className="mt-3">
                    <p className="fw-semibold mb-2 small">Attachments</p>
                    <div className="pp-attachment-list">
                      {item.attachments.map((att) => (
                        <div key={att.id} className="pp-attachment-row justify-content-between">
                          <span className="small">{att.originalFileName}</span>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() =>
                              downloadAttachment(att.id, selectedChildId, att.originalFileName)
                            }
                          >
                            Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
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

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ParentAnnouncementsPage() {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [detailItem, setDetailItem] = useState(null);

  const detailModalRef = useRef(null);

  // Load children on mount
  useEffect(() => {
    setChildrenLoading(true);
    getChildren()
      .then((res) => {
        const list = res.data.data || [];
        setChildren(list);
        if (list.length > 0) setSelectedChild(list[0]);
      })
      .catch(() => setError("Failed to load your children's information."))
      .finally(() => setChildrenLoading(false));
  }, []);

  const fetchItems = useCallback(
    async (pg = 0) => {
      if (!selectedChild) return;
      setLoading(true);
      setError("");
      try {
        const res = await listAnnouncements(selectedChild.id, { page: pg, size: 10 });
        const { content, totalPages: tp, number } = res.data.data;
        setItems(content);
        setTotalPages(tp);
        setPage(number);
      } catch {
        setError("Failed to load announcements. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [selectedChild]
  );

  useEffect(() => {
    if (selectedChild) {
      setPage(0);
      fetchItems(0);
    }
  }, [selectedChild]); // eslint-disable-line react-hooks/exhaustive-deps

  const openDetailModal = async (itemId) => {
    setDetailItem(null);
    const el = detailModalRef.current;
    if (el) window.bootstrap.Modal.getOrCreateInstance(el).show();
    try {
      const res = await getAnnouncementDetail(itemId, selectedChild.id);
      const detail = res.data.data;
      setDetailItem(detail);
      // Mark as viewed only after detail data is successfully loaded
      markAnnouncementViewed(selectedChild.id, itemId).catch(() => {});
      // Update viewed state in list locally
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, viewed: true } : i))
      );
    } catch {
      if (el) window.bootstrap.Modal.getOrCreateInstance(el).hide();
      setError("Failed to load announcement details.");
    }
  };

  const handleChildChange = (e) => {
    const child = children.find((c) => String(c.id) === e.target.value);
    if (child) setSelectedChild(child);
  };

  if (childrenLoading) {
    return (
      <div className="pp-page">
        <div className="pp-spinner-wrap">
          <span className="spinner-border text-primary" />
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="pp-page">
        <div className="pp-empty-state">
          <div className="pp-empty-icon">👨‍👩‍👧</div>
          <h5>No active children found</h5>
          <p className="text-muted">
            Your account is not linked to any active students. Please contact the school office.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pp-page">
      <div className="pp-page-header">
        <div>
          <h2 className="pp-page-title">Announcements</h2>
          <p className="pp-page-subtitle">Updates and notices from your child's class</p>
        </div>
      </div>

      {/* Child selector — only shown if 2+ active children */}
      {children.length >= 2 && (
        <div className="pp-child-selector mb-4">
          <label className="fw-semibold small me-2" htmlFor="child-select">
            Viewing for:
          </label>
          <select
            id="child-select"
            className="form-select form-select-sm"
            style={{ maxWidth: 280 }}
            value={selectedChild?.id || ""}
            onChange={handleChildChange}
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} — {c.currentLevel}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Single child — show name as context label */}
      {children.length === 1 && selectedChild && (
        <div className="pp-child-label mb-4">
          <span className="text-muted small">Class: </span>
          <span className="fw-semibold small">{selectedChild.fullName} — {selectedChild.currentLevel}</span>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible">
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")} />
        </div>
      )}

      {loading ? (
        <div className="pp-spinner-wrap">
          <span className="spinner-border text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="pp-empty-state">
          <div className="pp-empty-icon">📢</div>
          <h5>No announcements yet</h5>
          <p className="text-muted">
            There are no announcements for {selectedChild?.fullName}'s class yet.
          </p>
        </div>
      ) : (
        <>
          <div className="pp-card-list">
            {items.map((item) => (
              <div
                key={item.id}
                className={`pp-card ${item.pinned ? "pp-card-pinned" : ""} ${item.urgent ? "pp-card-urgent" : ""}`}
                onClick={() => openDetailModal(item.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && openDetailModal(item.id)}
              >
                <div className="pp-card-badges">
                  {!item.viewed && <span className="badge pp-badge-new">NEW</span>}
                  {item.pinned && <span className="badge pp-badge-pinned">Pinned</span>}
                  {item.urgent && <span className="badge pp-badge-urgent">Urgent</span>}
                </div>
                <h6 className="pp-card-title">{item.title}</h6>
                <p className="pp-card-excerpt">{item.bodyExcerpt}</p>
                <div className="pp-card-footer">
                  <span>{formatDateTime(item.createdAt)}</span>
                  {item.updatedAt && item.updatedAt !== item.createdAt && (
                    <span className="pp-card-updated">· Updated {formatDate(item.updatedAt)}</span>
                  )}
                  {item.attachmentCount > 0 && (
                    <span>· 📎 {item.attachmentCount}</span>
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

      <AnnouncementDetailModal
        modalRef={detailModalRef}
        item={detailItem}
        selectedChildId={selectedChild?.id}
        onViewed={() => {}}
      />
    </div>
  );
}
