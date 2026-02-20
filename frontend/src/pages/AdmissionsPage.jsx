import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getPublicAnnouncement,
  getAnnouncementPdfUrl,
  submitApplication,
} from "../services/api/admissionsService";
import logo from "../assets/logo.jpg";
import "./AdmissionsPage.css";

const LEVELS = [
  { value: "LKG1", label: "LKG 1" },
  { value: "UKG1", label: "UKG 1" },
  { value: "UKG2", label: "UKG 2" },
];

export default function AdmissionsPage() {
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    childFullName: "",
    dateOfBirth: "",
    levelApplyingFor: "",
    guardianFullName: "",
    email: "",
    phone: "",
    address: "",
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getPublicAnnouncement();
        setAnnouncement(res.data);
      } catch {
        setError("Unable to load admission information. Please try again later.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e) => {
    setFileError("");
    const file = e.target.files[0];
    if (!file) {
      setPdfFile(null);
      return;
    }
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
    setSubmitError("");

    if (!e.target.checkValidity() || !pdfFile) return;

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append("filledApplicationPdf", pdfFile);

    setSubmitting(true);
    try {
      const res = await submitApplication(fd);
      if (res.success) {
        setSubmitSuccess(res.data);
      } else {
        setSubmitError(res.error || "Submission failed.");
      }
    } catch (err) {
      setSubmitError(
        err?.response?.data?.error || "Submission failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isOpen = announcement && announcement.open;

  return (
    <div className="admissions-page">
      {/* Navbar */}
      <nav className="navbar sticky-top admissions-navbar">
        <div className="container">
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2">
            <img src={logo} alt="MerryKids" style={{ height: 36, borderRadius: 8 }} />
            <span className="fw-bold" style={{ color: "var(--mk-blue)" }}>
              MerryKids Nursery
            </span>
          </Link>
          <Link to="/" className="btn btn-outline-secondary btn-sm rounded-pill px-3">
            Back to Home
          </Link>
        </div>
      </nav>

      {/* Hero banner */}
      <div className="admissions-hero">
        <div className="container text-center">
          <h1 className="fw-bold text-white mb-2">Admissions</h1>
          <p className="text-white-50 mb-0">
            Begin your child&apos;s journey with MerryKids
          </p>
        </div>
      </div>

      <div className="container py-5">
        {/* Loading state */}
        {loading && (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="alert alert-danger text-center">{error}</div>
        )}

        {/* Admissions closed */}
        {!loading && !error && !isOpen && (
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 text-center p-5">
                <div style={{ fontSize: "3rem" }}>&#128218;</div>
                <h3 className="fw-bold mt-3" style={{ color: "var(--mk-blue)" }}>
                  Admissions are Currently Closed
                </h3>
                <p className="text-muted mb-0">
                  Please check back later for upcoming admission announcements.
                  We look forward to welcoming your child!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Admissions open - success */}
        {!loading && !error && isOpen && submitSuccess && (
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm rounded-4 text-center p-5">
                <div style={{ fontSize: "3rem" }}>&#9989;</div>
                <h3 className="fw-bold mt-3" style={{ color: "var(--mk-blue)" }}>
                  Application Submitted!
                </h3>
                <p className="text-muted">{submitSuccess.message}</p>
                <div className="admissions-ref-box">
                  <small className="text-muted d-block mb-1">Your Reference Number</small>
                  <span className="fw-bold fs-4" style={{ color: "var(--mk-blue)" }}>
                    {submitSuccess.referenceNo}
                  </span>
                </div>
                <p className="text-muted small mt-3 mb-0">
                  Please save this reference number for future correspondence.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Admissions open - show form */}
        {!loading && !error && isOpen && !submitSuccess && (
          <>
            {/* Announcement card */}
            <div className="row justify-content-center mb-4">
              <div className="col-lg-8">
                <div className="card border-0 shadow-sm rounded-4 p-4">
                  <div className="d-flex align-items-start gap-3">
                    <div className="admissions-announcement-icon">&#128227;</div>
                    <div className="flex-grow-1">
                      <h5 className="fw-bold mb-2" style={{ color: "var(--mk-blue)" }}>
                        Admission Announcement
                      </h5>
                      <p className="mb-2">{announcement.message}</p>
                      <div className="d-flex flex-wrap gap-3 mb-3">
                        <span className="badge rounded-pill admissions-date-badge">
                          Opens: {new Date(announcement.openDate).toLocaleDateString()}
                        </span>
                        <span className="badge rounded-pill admissions-date-badge">
                          Closes: {new Date(announcement.closeDate).toLocaleDateString()}
                        </span>
                      </div>
                      {announcement.hasApplicationPdf && (
                        <a
                          href={getAnnouncementPdfUrl()}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline-primary btn-sm rounded-pill px-4"
                        >
                          &#128196; Download Application Form
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submission form */}
            <div className="row justify-content-center">
              <div className="col-lg-8">
                <div className="card border-0 shadow-sm rounded-4 p-4">
                  <h5 className="fw-bold mb-4" style={{ color: "var(--mk-blue)" }}>
                    Submit Your Application
                  </h5>

                  {submitError && (
                    <div className="alert alert-danger">{submitError}</div>
                  )}

                  <form
                    noValidate
                    className={validated ? "was-validated" : ""}
                    onSubmit={handleSubmit}
                  >
                    <div className="row g-3">
                      {/* Child name */}
                      <div className="col-md-6">
                        <label className="form-label">Child&apos;s Full Name *</label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          name="childFullName"
                          value={form.childFullName}
                          onChange={handleChange}
                          required
                        />
                        <div className="invalid-feedback">Required</div>
                      </div>

                      {/* Date of birth */}
                      <div className="col-md-6">
                        <label className="form-label">Date of Birth *</label>
                        <input
                          type="date"
                          className="form-control rounded-3"
                          name="dateOfBirth"
                          value={form.dateOfBirth}
                          onChange={handleChange}
                          required
                        />
                        <div className="invalid-feedback">Required</div>
                      </div>

                      {/* Level */}
                      <div className="col-md-6">
                        <label className="form-label">Level Applying For *</label>
                        <select
                          className="form-select rounded-3"
                          name="levelApplyingFor"
                          value={form.levelApplyingFor}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select level...</option>
                          {LEVELS.map((l) => (
                            <option key={l.value} value={l.value}>
                              {l.label}
                            </option>
                          ))}
                        </select>
                        <div className="invalid-feedback">Required</div>
                      </div>

                      {/* Guardian name */}
                      <div className="col-md-6">
                        <label className="form-label">Guardian&apos;s Full Name *</label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          name="guardianFullName"
                          value={form.guardianFullName}
                          onChange={handleChange}
                          required
                        />
                        <div className="invalid-feedback">Required</div>
                      </div>

                      {/* Email */}
                      <div className="col-md-6">
                        <label className="form-label">Email Address *</label>
                        <input
                          type="email"
                          className="form-control rounded-3"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                        />
                        <div className="invalid-feedback">Valid email required</div>
                      </div>

                      {/* Phone */}
                      <div className="col-md-6">
                        <label className="form-label">Phone Number *</label>
                        <input
                          type="tel"
                          className="form-control rounded-3"
                          name="phone"
                          value={form.phone}
                          onChange={handleChange}
                          required
                        />
                        <div className="invalid-feedback">Required</div>
                      </div>

                      {/* Address */}
                      <div className="col-12">
                        <label className="form-label">Address *</label>
                        <textarea
                          className="form-control rounded-3"
                          name="address"
                          rows={2}
                          value={form.address}
                          onChange={handleChange}
                          required
                        />
                        <div className="invalid-feedback">Required</div>
                      </div>

                      {/* PDF upload */}
                      <div className="col-12">
                        <label className="form-label">
                          Filled Application Form (PDF, max 10MB) *
                        </label>
                        <input
                          type="file"
                          className={`form-control rounded-3 ${validated && !pdfFile ? "is-invalid" : ""}`}
                          accept="application/pdf"
                          onChange={handleFileChange}
                          required
                        />
                        {fileError && (
                          <div className="text-danger small mt-1">{fileError}</div>
                        )}
                        {validated && !pdfFile && !fileError && (
                          <div className="invalid-feedback d-block">PDF file is required</div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <button
                        type="submit"
                        className="btn btn-primary rounded-pill px-5"
                        style={{ backgroundColor: "var(--mk-blue)", borderColor: "var(--mk-blue)" }}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Application"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
