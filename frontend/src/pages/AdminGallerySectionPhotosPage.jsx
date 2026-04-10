import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpg";
import {
  getGalleryConfig,
  updateGalleryConfig,
  getAdminGalleryPhotos,
  deleteGalleryPhoto,
  bulkDeleteGalleryPhotos,
  getGalleryPhotoImageUrl,
} from "../services/api/gallerySectionService";
import "./AdminPages.css";

export default function AdminGallerySectionPhotosPage() {
  const navigate = useNavigate();

  // Config state
  const [configForm, setConfigForm] = useState({ sectionTitle: "", subtitle: "" });
  const [savedConfig, setSavedConfig] = useState({ sectionTitle: "", subtitle: "" });
  const [configEditing, setConfigEditing] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState("");
  const [configError, setConfigError] = useState("");

  // Photos state
  const [photos, setPhotos] = useState([]);
  const [photosLoading, setPhotosLoading] = useState(true);
  const [photosError, setPhotosError] = useState("");

  // Single delete state
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const deleteModalRef = useRef(null);
  const deleteModalInstance = useRef(null);
  const bulkDeleteModalRef = useRef(null);
  const bulkDeleteModalInstance = useRef(null);
  const selectAllCheckboxRef = useRef(null);

  // Init modals
  useEffect(() => {
    if (deleteModalRef.current) {
      deleteModalInstance.current = new window.bootstrap.Modal(deleteModalRef.current);
    }
    if (bulkDeleteModalRef.current) {
      bulkDeleteModalInstance.current = new window.bootstrap.Modal(bulkDeleteModalRef.current);
    }
    return () => {
      deleteModalInstance.current?.dispose();
      bulkDeleteModalInstance.current?.dispose();
    };
  }, []);

  // Update Select All checkbox indeterminate state
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      const allSelected = photos.length > 0 && selectedIds.size === photos.length;
      const someSelected = selectedIds.size > 0 && selectedIds.size < photos.length;
      selectAllCheckboxRef.current.checked = allSelected;
      selectAllCheckboxRef.current.indeterminate = someSelected;
    }
  }, [selectedIds, photos]);

  // Load config
  useEffect(() => {
    setConfigLoading(true);
    getGalleryConfig()
      .then((res) => {
        const loaded = {
          sectionTitle: res.data.sectionTitle || "",
          subtitle: res.data.subtitle || "",
        };
        setConfigForm(loaded);
        setSavedConfig(loaded);
      })
      .catch(() => setConfigError("Failed to load section config."))
      .finally(() => setConfigLoading(false));
  }, []);

  // Load photos
  const fetchPhotos = () => {
    setPhotosLoading(true);
    setPhotosError("");
    getAdminGalleryPhotos()
      .then((res) => {
        setPhotos(res.data || []);
        setSelectedIds(new Set());
      })
      .catch(() => setPhotosError("Failed to load photos."))
      .finally(() => setPhotosLoading(false));
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  // ── Config handlers ────────────────────────────────────────────────────────

  const handleConfigChange = (e) => {
    setConfigForm({ ...configForm, [e.target.name]: e.target.value });
  };

  const handleConfigSave = async (e) => {
    e.preventDefault();
    if (!configForm.sectionTitle.trim() || !configForm.subtitle.trim()) {
      setConfigError("Both fields are required.");
      return;
    }
    setConfigSaving(true);
    setConfigSuccess("");
    setConfigError("");
    try {
      await updateGalleryConfig({
        sectionTitle: configForm.sectionTitle.trim(),
        subtitle: configForm.subtitle.trim(),
      });
      const saved = {
        sectionTitle: configForm.sectionTitle.trim(),
        subtitle: configForm.subtitle.trim(),
      };
      setSavedConfig(saved);
      setConfigEditing(false);
      setConfigSuccess("Section config saved successfully.");
      setTimeout(() => setConfigSuccess(""), 3000);
    } catch (err) {
      setConfigError(err.response?.data?.error || "Failed to save config.");
    } finally {
      setConfigSaving(false);
    }
  };

  const handleConfigCancel = () => {
    setConfigForm(savedConfig);
    setConfigEditing(false);
    setConfigError("");
  };

  // ── Single delete ──────────────────────────────────────────────────────────

  const openDeleteModal = (id) => {
    setDeleteId(id);
    deleteModalInstance.current?.show();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteGalleryPhoto(deleteId);
      deleteModalInstance.current?.hide();
      setDeleteId(null);
      fetchPhotos();
    } catch (err) {
      setPhotosError(err.response?.data?.error || "Failed to delete photo.");
      deleteModalInstance.current?.hide();
    } finally {
      setDeleting(false);
    }
  };

  // ── Multi-select ───────────────────────────────────────────────────────────

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(photos.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  // ── Bulk delete ────────────────────────────────────────────────────────────

  const openBulkDeleteModal = () => {
    bulkDeleteModalInstance.current?.show();
  };

  const confirmBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await bulkDeleteGalleryPhotos(Array.from(selectedIds));
      bulkDeleteModalInstance.current?.hide();
      fetchPhotos();
    } catch (err) {
      setPhotosError(err.response?.data?.error || "Failed to delete selected photos.");
      bulkDeleteModalInstance.current?.hide();
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div>
      <div className="admin-mgmt-header d-flex align-items-center gap-3">
        <img src={logo} alt="MerryKids" className="admin-mgmt-header-logo" />
        <div>
          <h5 className="fw-bold mb-0" style={{ color: "var(--mk-blue)" }}>
            Gallery Photos
          </h5>
          <small className="text-muted">Edit section config and manage gallery photos</small>
        </div>
      </div>

      {/* Section Config */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="fw-bold mb-0" style={{ color: "var(--mk-blue)" }}>
            Section Content
          </h6>
          {!configLoading && !configEditing && (
            <button
              className="btn btn-sm btn-outline-primary rounded-3"
              onClick={() => {
                setConfigSuccess("");
                setConfigError("");
                setConfigEditing(true);
              }}
            >
              Edit Details
            </button>
          )}
        </div>

        {configLoading ? (
          <div className="text-center py-3">
            <span className="spinner-border spinner-border-sm text-primary" />
          </div>
        ) : !configEditing ? (
          <div className="admin-detail-section">
            {configSuccess && (
              <div className="alert alert-success py-2 small mb-3">{configSuccess}</div>
            )}
            {configError && (
              <div className="alert alert-danger py-2 small mb-3">
                {configError}
                <button
                  type="button"
                  className="btn-close btn-close-sm float-end"
                  onClick={() => setConfigError("")}
                />
              </div>
            )}
            <div className="row g-3">
              <div className="col-12">
                <div className="small text-muted fw-semibold mb-1">Section Heading</div>
                <div className="fw-semibold">
                  {savedConfig.sectionTitle || (
                    <span className="text-muted fst-italic">Not set</span>
                  )}
                </div>
              </div>
              <div className="col-12">
                <div className="small text-muted fw-semibold mb-1">Subtitle / Description</div>
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {savedConfig.subtitle || (
                    <span className="text-muted fst-italic">Not set</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfigSave}>
            {configError && (
              <div className="alert alert-danger py-2 small mb-3">
                {configError}
                <button
                  type="button"
                  className="btn-close btn-close-sm float-end"
                  onClick={() => setConfigError("")}
                />
              </div>
            )}
            <div className="mb-3">
              <label className="form-label fw-semibold small">Section Heading</label>
              <input
                type="text"
                className="form-control rounded-3"
                name="sectionTitle"
                value={configForm.sectionTitle}
                onChange={handleConfigChange}
                maxLength={120}
                placeholder="e.g. Gallery"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Subtitle / Description</label>
              <textarea
                className="form-control rounded-3"
                name="subtitle"
                value={configForm.subtitle}
                onChange={handleConfigChange}
                rows={3}
                maxLength={1000}
                placeholder="A short description shown below the heading..."
                required
              />
            </div>
            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary rounded-3 admin-action-btn"
                disabled={configSaving}
              >
                {configSaving && <span className="spinner-border spinner-border-sm me-2" />}
                Save Config
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary rounded-3 admin-action-btn"
                onClick={handleConfigCancel}
                disabled={configSaving}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Photos Grid */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <div className="d-flex align-items-center gap-3">
            <h6 className="fw-bold mb-0" style={{ color: "var(--mk-blue)" }}>
              Photos
            </h6>
            {photos.length > 0 && (
              <div className="d-flex align-items-center gap-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  ref={selectAllCheckboxRef}
                  onChange={handleSelectAll}
                  id="gallery-select-all"
                  title="Select all photos"
                  style={{ cursor: "pointer" }}
                />
                <label
                  htmlFor="gallery-select-all"
                  className="form-check-label small text-muted"
                  style={{ cursor: "pointer" }}
                >
                  Select all
                </label>
              </div>
            )}
          </div>
          <div className="d-flex gap-2 flex-wrap">
            {selectedIds.size > 0 && (
              <button
                className="btn btn-sm btn-danger rounded-3"
                onClick={openBulkDeleteModal}
              >
                Delete Selected ({selectedIds.size})
              </button>
            )}
            <button
              className="btn btn-sm rounded-3"
              style={{ background: "var(--mk-pink)", color: "#fff", border: "none" }}
              onClick={() => navigate("/admin/gallery/photos/upload")}
            >
              + Upload Photos
            </button>
          </div>
        </div>

        {photosError && (
          <div className="alert alert-danger py-2 small">
            {photosError}
            <button
              type="button"
              className="btn-close btn-close-sm float-end"
              onClick={() => setPhotosError("")}
            />
          </div>
        )}

        {photosLoading ? (
          <div className="text-center py-4">
            <span className="spinner-border text-primary" />
          </div>
        ) : photos.length === 0 ? (
          <div className="admin-empty-state py-4">
            <div className="admin-empty-state-icon">📷</div>
            <h5>No Photos Yet</h5>
            <p>Upload your first gallery photo using the button above.</p>
          </div>
        ) : (
          <div className="row row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-5 row-cols-xl-6 g-3">
            {photos.map((photo) => {
              const isSelected = selectedIds.has(photo.id);
              return (
                <div className="col" key={photo.id}>
                  <div
                    style={{
                      borderRadius: 10,
                      border: isSelected
                        ? "2.5px solid var(--mk-blue)"
                        : "1.5px solid #e2e8f0",
                      overflow: "hidden",
                      boxShadow: isSelected
                        ? "0 0 0 3px rgba(37,99,235,0.12)"
                        : "0 1px 3px rgba(0,0,0,0.06)",
                      transition: "border-color 0.15s, box-shadow 0.15s",
                      background: "#fff",
                    }}
                  >
                    {/* Image with checkbox overlay */}
                    <div style={{ position: "relative" }}>
                      {photo.hasImage ? (
                        <img
                          src={getGalleryPhotoImageUrl(photo.id)}
                          alt={`Gallery photo ${photo.id}`}
                          style={{
                            width: "100%",
                            aspectRatio: "1",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            aspectRatio: "1",
                            background: "#f1f5f9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75rem",
                            color: "#94a3b8",
                          }}
                        >
                          No image
                        </div>
                      )}
                      {/* Checkbox top-left overlay */}
                      <div
                        style={{
                          position: "absolute",
                          top: 6,
                          left: 6,
                          background: "rgba(255,255,255,0.85)",
                          borderRadius: 5,
                          padding: "2px 4px",
                          lineHeight: 1,
                        }}
                      >
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={isSelected}
                          onChange={() => toggleSelect(photo.id)}
                          style={{ cursor: "pointer" }}
                        />
                      </div>
                    </div>
                    {/* Delete action row */}
                    <div
                      className="d-flex justify-content-end"
                      style={{ padding: "6px 8px" }}
                    >
                      <button
                        className="btn btn-sm btn-outline-danger rounded-3"
                        style={{ fontSize: "0.72rem", padding: "2px 10px" }}
                        onClick={() => openDeleteModal(photo.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        className="btn btn-outline-secondary rounded-3"
        onClick={() => navigate("/admin/gallery")}
      >
        &larr; Back to Gallery
      </button>

      {/* Single Delete Confirmation Modal */}
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
                Are you sure you want to delete this photo? It will be removed from the public
                gallery immediately.
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

      {/* Bulk Delete Confirmation Modal */}
      <div className="modal fade" ref={bulkDeleteModalRef} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4">
            <div className="modal-header border-0">
              <h5 className="modal-title fw-bold" style={{ color: "var(--mk-blue)" }}>
                Confirm Bulk Delete
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <p className="admin-confirm-text">
                Are you sure you want to delete{" "}
                <strong>
                  {selectedIds.size} photo{selectedIds.size !== 1 ? "s" : ""}
                </strong>
                ? They will be removed from the public gallery immediately.
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
                onClick={confirmBulkDelete}
                disabled={bulkDeleting}
              >
                {bulkDeleting && <span className="spinner-border spinner-border-sm me-2" />}
                Delete {selectedIds.size} Photo{selectedIds.size !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
