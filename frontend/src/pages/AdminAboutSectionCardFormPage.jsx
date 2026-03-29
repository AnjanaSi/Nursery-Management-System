import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../assets/logo.jpg";
import {
  createAboutCard,
  updateAboutCard,
  getAdminAboutCard,
  getAboutCardImageUrl,
} from "../services/api/aboutSectionService";
import "./AdminPages.css";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function AdminAboutSectionCardFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [card, setCard] = useState(null);
  const [form, setForm] = useState({ title: "", description: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Edit mode starts in read-only view; create mode starts in form view
  const [editing, setEditing] = useState(!isEdit);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [validated, setValidated] = useState(false);

  const fileInputRef = useRef(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // Load card data in edit mode
  const loadCard = async () => {
    if (!isEdit) return;
    setLoading(true);
    setError("");
    try {
      const res = await getAdminAboutCard(id);
      const c = res.data;
      setCard(c);
      setForm({ title: c.title || "", description: c.description || "" });
    } catch {
      setError("Failed to load card.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCard();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImagePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`"${file.name}" is not a supported format. Use JPG, PNG, or WEBP.`);
      e.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`"${file.name}" exceeds the 5MB limit.`);
      e.target.value = "";
      return;
    }
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError("");
  };

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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

    setSubmitting(true);
    setError("");
    setSuccess("");
    const payload = { title: form.title.trim(), description: form.description.trim() };

    try {
      if (isEdit) {
        const res = await updateAboutCard(id, payload, imageFile);
        const updated = res.data;
        setCard(updated);
        setForm({ title: updated.title, description: updated.description });
        clearImage();
        setEditing(false);
        setSuccess("Card updated successfully.");
        setValidated(false);
      } else {
        await createAboutCard(payload, imageFile);
        navigate("/admin/about-section/cards");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save card. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = () => {
    setEditing(true);
    setError("");
    setSuccess("");
    setValidated(false);
  };

  const handleCancelEdit = () => {
    if (card) {
      setForm({ title: card.title, description: card.description });
    }
    clearImage();
    setEditing(false);
    setError("");
    setValidated(false);
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="text-center py-5">
        <span className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="admin-mgmt-header d-flex align-items-center gap-3">
        <img src={logo} alt="MerryKids" className="admin-mgmt-header-logo" />
        <div>
          <h5 className="fw-bold mb-0" style={{ color: "var(--mk-blue)" }}>
            {isEdit ? "Edit About Card" : "Add New About Card"}
          </h5>
          <small className="text-muted">
            {isEdit ? "Update card content and image" : "Create a new card for the About section"}
          </small>
        </div>
      </div>

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

      {/* ── Read-Only View (edit mode, not currently editing) ── */}
      {isEdit && !editing && card && (
        <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
          <div className="admin-detail-section mb-4">
            <div className="admin-form-section-title mb-3">Card Details</div>
            <div className="row g-3">
              <div className="col-12">
                <div className="small text-muted fw-semibold mb-1">Title</div>
                <div className="fw-semibold">{card.title}</div>
              </div>
              <div className="col-12">
                <div className="small text-muted fw-semibold mb-1">Description</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{card.description}</div>
              </div>
              <div className="col-md-6">
                <div className="small text-muted fw-semibold mb-1">Display Order</div>
                <div>{card.displayOrder}</div>
              </div>
              <div className="col-md-6">
                <div className="small text-muted fw-semibold mb-1">Has Image</div>
                <div>
                  {card.hasImage ? (
                    <span className="badge bg-success">Yes</span>
                  ) : (
                    <span className="badge bg-secondary">No</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {card.hasImage && (
            <div className="mb-4">
              <div className="admin-form-section-title mb-3">Current Image</div>
              <div style={{ maxWidth: 320 }}>
                <img
                  src={getAboutCardImageUrl(card.id)}
                  alt={card.title}
                  style={{
                    width: "100%",
                    aspectRatio: "16/9",
                    objectFit: "cover",
                    borderRadius: 10,
                    border: "1px solid var(--mk-border)",
                  }}
                />
              </div>
            </div>
          )}

          <div className="d-flex gap-2">
            <button
              className="btn btn-primary rounded-3 admin-action-btn"
              onClick={handleStartEdit}
            >
              Edit Details
            </button>
            <button
              className="btn btn-outline-secondary rounded-3 admin-action-btn"
              onClick={() => navigate("/admin/about-section/cards")}
            >
              &larr; Back to List
            </button>
          </div>
        </div>
      )}

      {/* ── Form View (create or editing) ── */}
      {editing && (
        <form
          onSubmit={handleSubmit}
          className={`card border-0 shadow-sm rounded-4 p-4 mb-4 ${validated ? "was-validated" : ""}`}
          noValidate
        >
          {/* Card Details */}
          <div className="admin-form-section mb-4">
            <div className="admin-form-section-title">Card Details</div>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label fw-semibold small">
                  Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control rounded-3"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  maxLength={120}
                  placeholder="e.g. Safe Environment"
                  required
                  minLength={3}
                />
                <div className="invalid-feedback">Title is required (min 3 characters).</div>
              </div>
              <div className="col-12">
                <label className="form-label fw-semibold small">
                  Description <span className="text-danger">*</span>
                </label>
                <textarea
                  className="form-control rounded-3"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={4}
                  maxLength={2000}
                  placeholder="Describe this feature or highlight..."
                  required
                  minLength={10}
                />
                <div className="invalid-feedback">Description is required (min 10 characters).</div>
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="admin-form-section mb-4">
            <div className="admin-form-section-title">
              {isEdit ? "Replace Image (optional)" : "Card Image"}
            </div>

            {/* Show current image in edit mode */}
            {isEdit && card?.hasImage && !imagePreview && (
              <div className="mb-3">
                <div className="small text-muted mb-2">Current image — upload a replacement below to change it.</div>
                <div style={{ maxWidth: 240 }}>
                  <img
                    src={getAboutCardImageUrl(card.id)}
                    alt="Current"
                    style={{
                      width: "100%",
                      aspectRatio: "16/9",
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid var(--mk-border)",
                    }}
                  />
                </div>
              </div>
            )}

            <div className="mb-2">
              <label className="form-label fw-semibold small">
                {isEdit ? "Upload New Image" : "Upload Image"}
                {!isEdit && <span className="text-muted ms-1">(optional for now)</span>}
              </label>
              <input
                ref={fileInputRef}
                type="file"
                className="form-control rounded-3"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImagePick}
              />
              <div className="form-text">JPG, PNG, or WEBP — max 5MB</div>
            </div>

            {imagePreview && (
              <div className="mt-2">
                <div className="small text-muted mb-2">Preview:</div>
                <div style={{ maxWidth: 280, position: "relative", display: "inline-block" }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      width: "100%",
                      aspectRatio: "16/9",
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid var(--mk-border)",
                      display: "block",
                    }}
                  />
                </div>
                <div className="mt-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger rounded-3"
                    onClick={clearImage}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="d-flex flex-wrap gap-2">
            <button
              type="submit"
              className="btn btn-primary rounded-3 admin-action-btn"
              disabled={submitting}
            >
              {submitting && <span className="spinner-border spinner-border-sm me-2" />}
              {isEdit ? "Save Changes" : "Create Card"}
            </button>
            {isEdit ? (
              <button
                type="button"
                className="btn btn-outline-secondary rounded-3 admin-action-btn"
                onClick={handleCancelEdit}
                disabled={submitting}
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-outline-secondary rounded-3 admin-action-btn"
                onClick={() => navigate("/admin/about-section/cards")}
                disabled={submitting}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
