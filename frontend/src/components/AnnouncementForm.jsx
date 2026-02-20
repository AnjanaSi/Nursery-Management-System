import { useState, useEffect, useRef } from "react";
import { createOrUpdateAnnouncement } from "../services/api/admissionsService";

export default function AnnouncementForm({ existing, onSaved, onClose }) {
  const [message, setMessage] = useState("");
  const [openDate, setOpenDate] = useState("");
  const [closeDate, setCloseDate] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [validated, setValidated] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    if (existing) {
      setMessage(existing.message || "");
      setOpenDate(existing.openDate || "");
      setCloseDate(existing.closeDate || "");
    }
  }, [existing]);

  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    const modal = new window.bootstrap.Modal(el);
    modal.show();

    const handleHidden = () => onClose?.();
    el.addEventListener("hidden.bs.modal", handleHidden);
    return () => {
      el.removeEventListener("hidden.bs.modal", handleHidden);
      modal.dispose();
    };
  }, [onClose]);

  const handleFileChange = (e) => {
    setFileError("");
    const file = e.target.files[0];
    if (!file) { setPdfFile(null); return; }
    if (file.type !== "application/pdf") {
      setFileError("Only PDF files are accepted.");
      setPdfFile(null);
      e.target.value = "";
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError("File size must not exceed 10MB.");
      setPdfFile(null);
      e.target.value = "";
      return;
    }
    setPdfFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidated(true);
    setError("");

    if (!e.target.checkValidity()) return;
    if (openDate > closeDate) {
      setError("Open date must be before close date.");
      return;
    }

    const fd = new FormData();
    fd.append("message", message);
    fd.append("openDate", openDate);
    fd.append("closeDate", closeDate);
    if (pdfFile) fd.append("applicationPdf", pdfFile);

    setSaving(true);
    try {
      const res = await createOrUpdateAnnouncement(fd);
      if (res.success) {
        onSaved?.(res.data);
        const el = modalRef.current;
        const modal = window.bootstrap.Modal.getInstance(el);
        modal?.hide();
      } else {
        setError(res.error || "Failed to save.");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to save announcement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal fade" ref={modalRef} tabIndex={-1}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content rounded-4">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold" style={{ color: "var(--mk-blue)" }}>
              {existing ? "Update Announcement" : "Create Announcement"}
            </h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" />
          </div>
          <form
            noValidate
            className={validated ? "was-validated" : ""}
            onSubmit={handleSubmit}
          >
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}

              <div className="mb-3">
                <label className="form-label">Announcement Message *</label>
                <textarea
                  className="form-control rounded-3"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                />
                <div className="invalid-feedback">Required</div>
              </div>

              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label className="form-label">Open Date *</label>
                  <input
                    type="date"
                    className="form-control rounded-3"
                    value={openDate}
                    onChange={(e) => setOpenDate(e.target.value)}
                    required
                  />
                  <div className="invalid-feedback">Required</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Close Date *</label>
                  <input
                    type="date"
                    className="form-control rounded-3"
                    value={closeDate}
                    onChange={(e) => setCloseDate(e.target.value)}
                    required
                  />
                  <div className="invalid-feedback">Required</div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">
                  Application Form PDF (optional, max 10MB)
                </label>
                <input
                  type="file"
                  className="form-control rounded-3"
                  accept="application/pdf"
                  onChange={handleFileChange}
                />
                {fileError && (
                  <div className="text-danger small mt-1">{fileError}</div>
                )}
                {existing?.hasApplicationPdf && !pdfFile && (
                  <div className="text-muted small mt-1">
                    Current file: {existing.applicationPdfOriginalName || "application.pdf"}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer border-0 pt-0">
              <button type="button" className="btn btn-light rounded-pill px-4" data-bs-dismiss="modal">
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary rounded-pill px-4"
                style={{ backgroundColor: "var(--mk-blue)", borderColor: "var(--mk-blue)" }}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Saving...
                  </>
                ) : (
                  "Save Announcement"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
