import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../services/authService";
import logo from "../assets/logo.jpg";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidated(true);
    setError("");

    if (!email) return;

    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        background: "linear-gradient(135deg, var(--mk-blue-light) 0%, #E0E7FF 100%)",
      }}
    >
      <div className="card shadow border-0 rounded-4 p-4" style={{ maxWidth: 440, width: "100%" }}>
        <div className="text-center mb-4">
          <div
            className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle overflow-hidden"
            style={{
              width: 64,
              height: 64,
              backgroundColor: "var(--mk-blue)",
            }}
          >
            <img src={logo} alt="MerryKids" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <h4 className="fw-bold" style={{ color: "var(--mk-blue)" }}>
            Forgot Password
          </h4>
          <p className="text-muted small">
            Enter your email address and we'll send you a reset link.
          </p>
        </div>

        {success ? (
          <div>
            <div className="alert alert-success py-2 small">
              If an account with that email exists, a password reset link has been sent.
            </div>
            <div className="text-center mt-3">
              <Link to="/login" className="text-decoration-none" style={{ color: "var(--mk-blue)" }}>
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div className="alert alert-danger py-2 small">{error}</div>
            )}

            <form
              noValidate
              className={validated ? "was-validated" : ""}
              onSubmit={handleSubmit}
            >
              <div className="mb-4">
                <label className="form-label small fw-semibold">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  placeholder="you@example.com"
                />
                <div className="invalid-feedback">Please enter a valid email.</div>
              </div>
              <button
                type="submit"
                className="btn mk-btn-primary w-100 py-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>

            <div className="text-center mt-3">
              <Link
                to="/login"
                className="text-decoration-none small"
                style={{ color: "var(--mk-pink)" }}
              >
                Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
