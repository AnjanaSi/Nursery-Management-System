import { useState, useEffect, useRef } from "react";
import {
  updateSubmissionStatus,
  updateSubmissionNote,
  downloadSubmissionPdf,
} from "../services/api/admissionsService";
import axiosClient from "../services/api/axiosClient";

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

export default function SubmissionDetailModal({ submission, onClose, onUpdated }) {
  const [status, setStatus] = useState(submission?.status || "");
  const [note, setNote] = useState(submission?.adminNote || "");
  const [statusSaving, setStatusSaving] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountMsg, setAccountMsg] = useState("");
  const [error, setError] = useState("");
  const modalRef = useRef(null);

  useEffect(() => {
    if (submission) {
      setStatus(submission.status);
      setNote(submission.adminNote || "");
      setAccountMsg("");
      setError("");
    }
  }, [submission]);

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

  const handleStatusChange = async (newStatus) => {
    setStatusSaving(true);
    setError("");
    try {
      const res = await updateSubmissionStatus(submission.id, newStatus);
      if (res.success) {
        setStatus(newStatus);
        onUpdated?.(res.data);
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to update status.");
    } finally {
      setStatusSaving(false);
    }
  };

  const handleNoteSave = async () => {
    setNoteSaving(true);
    setError("");
    try {
      const res = await updateSubmissionNote(submission.id, note);
      if (res.success) onUpdated?.(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || "Failed to save note.");
    } finally {
      setNoteSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      await downloadSubmissionPdf(submission.id);
    } catch {
      setError("Failed to download PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const handleCreateParentAccount = async () => {
    setCreatingAccount(true);
    setAccountMsg("");
    try {
      const res = await axiosClient.post("/api/v1/admin/users", {
        email: submission.email,
        role: "PARENT",
      });
      if (res.data.success) {
        setAccountMsg("Parent account created! A welcome email with temporary password has been sent.");
      }
    } catch (err) {
      const errMsg = err?.response?.data?.error || "";
      if (errMsg.toLowerCase().includes("already exists")) {
        setAccountMsg("A parent account with this email already exists.");
      } else {
        setAccountMsg(errMsg || "Failed to create parent account.");
      }
    } finally {
      setCreatingAccount(false);
    }
  };

  if (!submission) return null;

  return (
    <div className="modal fade" ref={modalRef} tabIndex={-1}>
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content rounded-4">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold" style={{ color: "var(--mk-blue)" }}>
              Application Details
            </h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" />
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger py-2">{error}</div>}

            {/* Reference & status */}
            <div className="d-flex flex-wrap align-items-center gap-2 mb-3">
              <span className="fw-bold" style={{ color: "var(--mk-blue)" }}>
                {submission.referenceNo}
              </span>
              <span className={`badge bg-${STATUS_COLORS[status] || "secondary"}`}>
                {statusLabel(status)}
              </span>
            </div>

            {/* Details grid */}
            <div className="row g-3 mb-4">
              <div className="col-md-6">
                <label className="text-muted small">Child&apos;s Name</label>
                <div className="fw-semibold">{submission.childFullName}</div>
              </div>
              <div className="col-md-6">
                <label className="text-muted small">Date of Birth</label>
                <div className="fw-semibold">
                  {submission.dateOfBirth
                    ? new Date(submission.dateOfBirth).toLocaleDateString()
                    : "-"}
                </div>
              </div>
              <div className="col-md-6">
                <label className="text-muted small">Level Applying For</label>
                <div className="fw-semibold">{submission.levelApplyingFor}</div>
              </div>
              <div className="col-md-6">
                <label className="text-muted small">Guardian&apos;s Name</label>
                <div className="fw-semibold">{submission.guardianFullName}</div>
              </div>
              <div className="col-md-6">
                <label className="text-muted small">Email</label>
                <div className="fw-semibold">{submission.email}</div>
              </div>
              <div className="col-md-6">
                <label className="text-muted small">Phone</label>
                <div className="fw-semibold">{submission.phone}</div>
              </div>
              <div className="col-12">
                <label className="text-muted small">Address</label>
                <div className="fw-semibold">{submission.address}</div>
              </div>
              <div className="col-md-6">
                <label className="text-muted small">Submitted</label>
                <div className="fw-semibold">
                  {submission.createdAt
                    ? new Date(submission.createdAt).toLocaleString()
                    : "-"}
                </div>
              </div>
            </div>

            {/* Download PDF */}
            {submission.submittedPdfOriginalName && (
              <div className="mb-4">
                <button
                  className="btn btn-outline-primary btn-sm rounded-pill px-4"
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" />
                      Downloading...
                    </>
                  ) : (
                    <>&#128196; Download Submitted PDF</>
                  )}
                </button>
              </div>
            )}

            <hr />

            {/* Status update */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Update Status</label>
              <div className="d-flex gap-2 align-items-center">
                <select
                  className="form-select rounded-3"
                  style={{ maxWidth: 280 }}
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={statusSaving}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusLabel(s)}
                    </option>
                  ))}
                </select>
                {statusSaving && (
                  <span className="spinner-border spinner-border-sm text-primary" />
                )}
              </div>
            </div>

            {/* Admin note */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Admin Note</label>
              <textarea
                className="form-control rounded-3"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <button
                className="btn btn-sm btn-outline-secondary rounded-pill px-3 mt-2"
                onClick={handleNoteSave}
                disabled={noteSaving}
              >
                {noteSaving ? "Saving..." : "Save Note"}
              </button>
            </div>

            {/* Create Parent Account */}
            {status === "ACCEPTED" && (
              <div className="mt-3 p-3 rounded-3" style={{ background: "var(--mk-blue-light)" }}>
                <h6 className="fw-bold mb-2" style={{ color: "var(--mk-blue)" }}>
                  Create Parent Account
                </h6>
                <p className="text-muted small mb-2">
                  Send a temporary password to <strong>{submission.email}</strong> so
                  they can access the parent portal.
                </p>
                {accountMsg && (
                  <div
                    className={`alert ${accountMsg.includes("created") ? "alert-success" : "alert-warning"} py-2 small`}
                  >
                    {accountMsg}
                  </div>
                )}
                <button
                  className="btn btn-primary btn-sm rounded-pill px-4"
                  style={{ backgroundColor: "var(--mk-blue)", borderColor: "var(--mk-blue)" }}
                  onClick={handleCreateParentAccount}
                  disabled={creatingAccount}
                >
                  {creatingAccount ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" />
                      Creating...
                    </>
                  ) : (
                    "Create Parent Account (Send Temp Password Email)"
                  )}
                </button>
              </div>
            )}
          </div>
          <div className="modal-footer border-0 pt-0">
            <button type="button" className="btn btn-light rounded-pill px-4" data-bs-dismiss="modal">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
