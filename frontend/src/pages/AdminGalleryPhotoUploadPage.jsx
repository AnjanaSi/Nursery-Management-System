import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpg";
import { uploadGalleryPhotos } from "../services/api/gallerySectionService";
import "./AdminPages.css";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export default function AdminGalleryPhotoUploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Array of { file, url } objects
  const [previews, setPreviews] = useState([]);
  const [fileErrors, setFileErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Revoke all preview URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const errors = [];
    const valid = [];

    files.forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        errors.push(`"${file.name}" is not a supported format (JPEG, PNG, WEBP only).`);
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        errors.push(`"${file.name}" exceeds the ${MAX_SIZE_MB}MB size limit.`);
        return;
      }
      valid.push(file);
    });

    setFileErrors(errors);

    // Revoke previous preview URLs before replacing
    previews.forEach((p) => URL.revokeObjectURL(p.url));

    const newPreviews = valid.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    setPreviews(newPreviews);

    // Reset input so the same files can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemove = (idx) => {
    const removed = previews[idx];
    URL.revokeObjectURL(removed.url);
    setPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (previews.length === 0) {
      setFileErrors(["Please select at least one image to upload."]);
      return;
    }

    setUploading(true);
    setUploadError("");
    try {
      await uploadGalleryPhotos(previews.map((p) => p.file));
      navigate("/admin/gallery/photos");
    } catch (err) {
      setUploadError(err.response?.data?.error || "Failed to upload photos. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="admin-mgmt-header d-flex align-items-center gap-3">
        <img src={logo} alt="MerryKids" className="admin-mgmt-header-logo" />
        <div>
          <h5 className="fw-bold mb-0" style={{ color: "var(--mk-blue)" }}>
            Upload Gallery Photos
          </h5>
          <small className="text-muted">Select one or more photos to add to the public gallery</small>
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
        <h6 className="fw-bold mb-3" style={{ color: "var(--mk-blue)" }}>
          Photos
        </h6>

        <form onSubmit={handleSubmit}>
          {uploadError && (
            <div className="alert alert-danger py-2 small mb-3">
              {uploadError}
              <button
                type="button"
                className="btn-close btn-close-sm float-end"
                onClick={() => setUploadError("")}
              />
            </div>
          )}

          <div className="mb-3">
            <label className="form-label fw-semibold small">
              Select Images <span className="text-danger">*</span>
            </label>
            <input
              type="file"
              className="form-control rounded-3"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              multiple
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <div className="form-text">
              Accepted formats: JPEG, PNG, WEBP. Max {MAX_SIZE_MB}MB per image. You can select multiple files at once.
            </div>
          </div>

          {/* Per-file validation errors */}
          {fileErrors.length > 0 && (
            <div className="alert alert-warning py-2 small mb-3">
              <strong>Some files were skipped:</strong>
              <ul className="mb-0 mt-1 ps-3">
                {fileErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Selected files count and thumbnails */}
          {previews.length > 0 && (
            <div className="mb-3">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="small fw-semibold text-muted">
                  {previews.length} photo{previews.length > 1 ? "s" : ""} selected
                </span>
                <span
                  className="badge rounded-pill"
                  style={{ background: "var(--mk-blue)", color: "#fff" }}
                >
                  {previews.length}
                </span>
              </div>
              <div className="d-flex flex-wrap gap-2">
                {previews.map((p, idx) => (
                  <div
                    key={idx}
                    style={{ position: "relative", display: "inline-block" }}
                  >
                    <img
                      src={p.url}
                      alt={p.file.name}
                      title={p.file.name}
                      style={{
                        width: 80,
                        height: 80,
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid var(--mk-border)",
                        display: "block",
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-danger rounded-circle"
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        width: 22,
                        height: 22,
                        padding: 0,
                        fontSize: "0.7rem",
                        lineHeight: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onClick={() => handleRemove(idx)}
                      title={`Remove ${p.file.name}`}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="d-flex gap-2 mt-3">
            <button
              type="submit"
              className="btn btn-primary rounded-3 admin-action-btn"
              disabled={uploading || previews.length === 0}
            >
              {uploading && <span className="spinner-border spinner-border-sm me-2" />}
              {uploading
                ? `Uploading ${previews.length} photo${previews.length > 1 ? "s" : ""}…`
                : `Upload ${previews.length > 0 ? previews.length : ""} Photo${previews.length !== 1 ? "s" : ""}`}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary rounded-3 admin-action-btn"
              onClick={() => navigate("/admin/gallery/photos")}
              disabled={uploading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
