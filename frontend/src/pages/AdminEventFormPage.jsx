import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../assets/logo.jpg";
import {
  createEvent,
  updateEvent,
  getAdminEventById,
  getEventPhotoUrl,
} from "../services/api/eventsService";
import "./AdminPages.css";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_PHOTOS = 10;

export default function AdminEventFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  // ── Loaded event data (edit mode) ──────────────────────────────────────
  const [event, setEvent] = useState(null);

  // ── Form state ─────────────────────────────────────────────────────────
  const [form, setForm] = useState({ title: "", description: "", eventDate: "" });
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [removePhotoIds, setRemovePhotoIds] = useState(new Set());
  const [newPhotoFiles, setNewPhotoFiles] = useState([]);
  const [newPhotoPreviews, setNewPhotoPreviews] = useState([]);

  // ── UI state ────────────────────────────────────────────────────────────
  // Edit mode starts in read-only view; create mode starts in form view
  const [editing, setEditing] = useState(!isEdit);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validated, setValidated] = useState(false);

  const fileInputRef = useRef(null);

  // ── Load event data (edit mode) ─────────────────────────────────────────
  const loadEvent = async () => {
    if (!isEdit) return;
    setLoading(true);
    setError("");
    try {
      const res = await getAdminEventById(id);
      const ev = res.data;
      setEvent(ev);
      setForm({
        title: ev.title || "",
        description: ev.description || "",
        eventDate: ev.eventDate || "",
      });
      setExistingPhotos(ev.photos || []);
    } catch {
      setError("Failed to load event.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      newPhotoPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newPhotoPreviews]);

  // ── Edit mode toggle ────────────────────────────────────────────────────
  const startEdit = () => {
    setError("");
    setSuccess("");
    setValidated(false);
    setRemovePhotoIds(new Set());
    setNewPhotoFiles([]);
    setNewPhotoPreviews([]);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError("");
    setValidated(false);
    // Restore form to saved state
    if (event) {
      setForm({
        title: event.title || "",
        description: event.description || "",
        eventDate: event.eventDate || "",
      });
      setExistingPhotos(event.photos || []);
    }
    setRemovePhotoIds(new Set());
    setNewPhotoFiles([]);
    newPhotoPreviews.forEach((url) => URL.revokeObjectURL(url));
    setNewPhotoPreviews([]);
  };

  // ── Form handlers ────────────────────────────────────────────────────────
  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhotoFilePick = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const validPreviews = [];
    const fileErrors = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        fileErrors.push(`"${file.name}" is not a supported format (JPG, PNG, WEBP).`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        fileErrors.push(`"${file.name}" exceeds the 5MB per-file limit.`);
        continue;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    if (fileErrors.length > 0) {
      setError(fileErrors.join(" "));
    } else {
      setError("");
    }

    setNewPhotoFiles((prev) => [...prev, ...validFiles]);
    setNewPhotoPreviews((prev) => [...prev, ...validPreviews]);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeNewPhoto = (index) => {
    URL.revokeObjectURL(newPhotoPreviews[index]);
    setNewPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleRemoveExisting = (photoId) => {
    setRemovePhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidated(true);

    if (!form.title.trim() || form.title.trim().length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }
    if (!form.description.trim() || form.description.trim().length < 10) {
      setError("Description must be at least 10 characters.");
      return;
    }
    if (!form.eventDate) {
      setError("Event date is required.");
      return;
    }

    const remainingExisting = existingPhotos.length - removePhotoIds.size;
    const totalPhotos = remainingExisting + newPhotoFiles.length;
    if (totalPhotos > MAX_PHOTOS) {
      setError(
        `Maximum ${MAX_PHOTOS} photos allowed per event. ` +
          `You have ${remainingExisting} existing and are adding ${newPhotoFiles.length} new.`
      );
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    const data = {
      title: form.title.trim(),
      description: form.description.trim(),
      eventDate: form.eventDate,
      removePhotoIds: [...removePhotoIds],
    };

    try {
      if (isEdit) {
        await updateEvent(id, data, newPhotoFiles);
        setSuccess("Event updated successfully.");
        setEditing(false);
        setValidated(false);
        setRemovePhotoIds(new Set());
        setNewPhotoFiles([]);
        newPhotoPreviews.forEach((url) => URL.revokeObjectURL(url));
        setNewPhotoPreviews([]);
        // Reload fresh data for read-only view
        const res = await getAdminEventById(id);
        setEvent(res.data);
        setExistingPhotos(res.data.photos || []);
        setForm({
          title: res.data.title,
          description: res.data.description,
          eventDate: res.data.eventDate,
        });
      } else {
        await createEvent(data, newPhotoFiles);
        // After create, go to list (not edit page)
        navigate("/admin/events/list");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save event. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Formatting ────────────────────────────────────────────────────────────
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
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

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="text-center py-5">
        <span className="spinner-border text-primary" />
      </div>
    );
  }

  const remainingExisting = existingPhotos.length - removePhotoIds.size;
  const totalPhotos = remainingExisting + newPhotoFiles.length;

  // ────────────────────────────────────────────────────────────────────────
  // READ-ONLY VIEW (edit mode only, when not editing)
  // ────────────────────────────────────────────────────────────────────────
  if (isEdit && !editing) {
    return (
      <div>
        <div className="admin-mgmt-header d-flex align-items-center gap-3">
          <img src={logo} alt="MerryKids" className="admin-mgmt-header-logo" />
          <div>
            <h5 className="fw-bold mb-0" style={{ color: "var(--mk-blue)" }}>
              Event Details
            </h5>
            <small className="text-muted">View event information</small>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger alert-dismissible fade show rounded-3">
            {error}
            <button type="button" className="btn-close" onClick={() => setError("")} />
          </div>
        )}
        {success && (
          <div className="alert alert-success alert-dismissible fade show rounded-3">
            {success}
            <button type="button" className="btn-close" onClick={() => setSuccess("")} />
          </div>
        )}

        {/* Event Details */}
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
          <h6 className="fw-bold mb-3" style={{ color: "var(--mk-blue)" }}>
            Event Information
          </h6>
          <div className="row mb-3">
            <div className="col-md-8">
              <div className="small text-muted fw-semibold mb-1">Title</div>
              <div className="fw-semibold">{event?.title}</div>
            </div>
            <div className="col-md-4">
              <div className="small text-muted fw-semibold mb-1">Event Date</div>
              <div>{formatDate(event?.eventDate)}</div>
            </div>
          </div>
          <div className="mb-3">
            <div className="small text-muted fw-semibold mb-1">Description</div>
            <p style={{ whiteSpace: "pre-line", lineHeight: 1.7 }} className="mb-0">
              {event?.description}
            </p>
          </div>
          <div className="row">
            <div className="col-md-6">
              <div className="small text-muted fw-semibold mb-1">Created</div>
              <div className="small">{formatDateTime(event?.createdAt)}</div>
            </div>
            <div className="col-md-6">
              <div className="small text-muted fw-semibold mb-1">Last Updated</div>
              <div className="small">{formatDateTime(event?.updatedAt)}</div>
            </div>
          </div>
        </div>

        {/* Photos read-only */}
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h6 className="fw-bold mb-0" style={{ color: "var(--mk-blue)" }}>
              Photos
            </h6>
            <span className="badge bg-light text-dark border">
              {existingPhotos.length} photo{existingPhotos.length !== 1 ? "s" : ""}
            </span>
          </div>
          {existingPhotos.length > 0 ? (
            <div className="row g-2">
              {existingPhotos.map((photo) => (
                <div key={photo.id} className="col-6 col-md-4 col-lg-3">
                  <div className="rounded-3 overflow-hidden border">
                    <img
                      src={getEventPhotoUrl(photo.id)}
                      alt={photo.originalFileName}
                      className="w-100"
                      style={{ height: 110, objectFit: "cover", display: "block" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted small mb-0">No photos uploaded for this event.</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="d-flex flex-wrap gap-2">
          <button
            className="btn btn-primary rounded-3"
            onClick={startEdit}
          >
            Edit Details
          </button>
          <button
            className="btn btn-outline-secondary rounded-3"
            onClick={() => navigate("/admin/events/list")}
          >
            &larr; Back to List
          </button>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // FORM VIEW (create mode, or edit mode when editing=true)
  // ────────────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="admin-mgmt-header d-flex align-items-center gap-3">
        <img src={logo} alt="MerryKids" className="admin-mgmt-header-logo" />
        <div>
          <h5 className="fw-bold mb-0" style={{ color: "var(--mk-blue)" }}>
            {isEdit ? "Edit Event" : "Add New Event"}
          </h5>
          <small className="text-muted">
            {isEdit ? "Update event details and manage photos" : "Create a new public event"}
          </small>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show rounded-3">
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")} />
        </div>
      )}
      {success && (
        <div className="alert alert-success rounded-3">{success}</div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Event Details */}
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
          <h6 className="fw-bold mb-3" style={{ color: "var(--mk-blue)" }}>
            Event Details
          </h6>

          <div className="mb-3">
            <label className="form-label fw-semibold">
              Title <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              name="title"
              className={`form-control rounded-3 ${
                validated && form.title.trim().length < 3 ? "is-invalid" : ""
              }`}
              value={form.title}
              onChange={handleFormChange}
              placeholder="e.g. Annual Sports Day"
              maxLength={120}
            />
            <div className="invalid-feedback">Title must be at least 3 characters.</div>
            <div className="form-text text-end">{form.title.length}/120</div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">
              Description <span className="text-danger">*</span>
            </label>
            <textarea
              name="description"
              className={`form-control rounded-3 ${
                validated && form.description.trim().length < 10 ? "is-invalid" : ""
              }`}
              rows={5}
              value={form.description}
              onChange={handleFormChange}
              placeholder="Describe the event in detail. Multi-paragraph text is supported."
              maxLength={5000}
            />
            <div className="invalid-feedback">Description must be at least 10 characters.</div>
            <div className="form-text text-end">{form.description.length}/5000</div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">
              Event Date <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              name="eventDate"
              className={`form-control rounded-3 ${
                validated && !form.eventDate ? "is-invalid" : ""
              }`}
              value={form.eventDate}
              onChange={handleFormChange}
            />
            <div className="invalid-feedback">Event date is required.</div>
          </div>
        </div>

        {/* Photos */}
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h6 className="fw-bold mb-0" style={{ color: "var(--mk-blue)" }}>
              Photos
            </h6>
            <span className="badge bg-light text-dark border">
              {totalPhotos} / {MAX_PHOTOS}
            </span>
          </div>

          {/* Existing photos (edit mode) */}
          {isEdit && existingPhotos.length > 0 && (
            <div className="mb-3">
              <p className="small text-muted mb-2">
                Existing photos — click <strong>Remove</strong> to mark for deletion (applied on save):
              </p>
              <div className="row g-2">
                {existingPhotos.map((photo) => {
                  const isMarked = removePhotoIds.has(photo.id);
                  return (
                    <div key={photo.id} className="col-6 col-md-4 col-lg-3">
                      <div
                        className="position-relative rounded-3 overflow-hidden border"
                        style={{ opacity: isMarked ? 0.4 : 1, transition: "opacity 0.2s" }}
                      >
                        <img
                          src={getEventPhotoUrl(photo.id)}
                          alt={photo.originalFileName}
                          className="w-100"
                          style={{ height: 110, objectFit: "cover", display: "block" }}
                        />
                        {isMarked && (
                          <div
                            className="position-absolute top-50 start-50 translate-middle"
                            style={{ pointerEvents: "none" }}
                          >
                            <span className="badge bg-danger">Removed</span>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        className={`btn btn-sm w-100 mt-1 rounded-3 ${
                          isMarked ? "btn-outline-secondary" : "btn-outline-danger"
                        }`}
                        onClick={() => toggleRemoveExisting(photo.id)}
                      >
                        {isMarked ? "Undo Remove" : "Remove"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* New photo upload */}
          {totalPhotos < MAX_PHOTOS && (
            <div className="mb-3">
              <label className="form-label small fw-semibold">
                Add Photos (JPG, PNG, WEBP — max 5MB each)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                className="form-control rounded-3"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handlePhotoFilePick}
              />
            </div>
          )}

          {totalPhotos >= MAX_PHOTOS && (
            <p className="text-muted small">
              Maximum of {MAX_PHOTOS} photos reached. Remove existing photos to add new ones.
            </p>
          )}

          {/* New photo previews */}
          {newPhotoPreviews.length > 0 && (
            <div>
              <p className="small text-muted mb-2">New photos to upload:</p>
              <div className="row g-2">
                {newPhotoPreviews.map((preview, idx) => (
                  <div key={idx} className="col-6 col-md-4 col-lg-3">
                    <div className="rounded-3 overflow-hidden border">
                      <img
                        src={preview}
                        alt={newPhotoFiles[idx]?.name}
                        className="w-100"
                        style={{ height: 110, objectFit: "cover", display: "block" }}
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger w-100 mt-1 rounded-3"
                      onClick={() => removeNewPhoto(idx)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="d-flex gap-2">
          <button
            type="submit"
            className="btn btn-primary rounded-3 px-4"
            disabled={submitting}
          >
            {submitting && <span className="spinner-border spinner-border-sm me-2" />}
            {isEdit ? "Save Changes" : "Create Event"}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary rounded-3"
            onClick={isEdit ? cancelEdit : () => navigate("/admin/events/list")}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
