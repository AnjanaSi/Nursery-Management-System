import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { resetPassword } from "../services/authService";
import logo from "../assets/logo.jpg";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);

  if (!token) {
    return (
      <div
        className="min-vh-100 d-flex align-items-center justify-content-center"
        style={{
          background: "linear-gradient(135deg, var(--mk-blue-light) 0%, #E0E7FF 100%)",
        }}
      >
        <div className="card shadow border-0 rounded-4 p-4 text-center" style={{ maxWidth: 440, width: "100%" }}>
          <div className="alert alert-danger py-2 small mb-3">
            Invalid reset link. Please request a new password reset.
          </div>
          <Link to="/forgot-password" className="text-decoration-none" style={{ color: "var(--mk-blue)" }}>
            Request New Reset Link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidated(true);
    setError("");

    if (!newPassword || !confirmPassword) return;

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, newPassword);
      setSuccess(true);
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to reset password.";
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
            Reset Password
          </h4>
        </div>

        {success ? (
          <div>
            <div className="alert alert-success py-2 small">
              Password has been reset successfully.
            </div>
            <div className="text-center mt-3">
              <Link to="/login" className="btn mk-btn-primary px-4">
                Go to Login
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
              <div className="mb-3">
                <label className="form-label small fw-semibold">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                />
                <div className="invalid-feedback">
                  Password must be at least 8 characters.
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label small fw-semibold">Confirm Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                />
                <div className="invalid-feedback">Please confirm your password.</div>
              </div>
              <button
                type="submit"
                className="btn mk-btn-primary w-100 py-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Resetting...
                  </>
                ) : (
                  "Reset Password"
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
