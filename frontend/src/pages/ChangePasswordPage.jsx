import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  isAuthenticated,
  getMustChangePassword,
  getRole,
  getRolePath,
  changePassword,
  logout,
} from "../services/authService";
import logo from "../assets/logo.jpg";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login", { replace: true });
      return;
    }
    if (!getMustChangePassword()) {
      navigate(getRolePath(getRole()), { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidated(true);
    setError("");

    if (!currentPassword || !newPassword || !confirmPassword) return;

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      navigate(getRolePath(getRole()), { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to change password.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
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
            Change Your Password
          </h4>
          <p className="text-muted small">
            You must change your temporary password before continuing.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 small">{error}</div>
        )}

        <form
          noValidate
          className={validated ? "was-validated" : ""}
          onSubmit={handleSubmit}
        >
          <div className="mb-3">
            <label className="form-label small fw-semibold">Current Password</label>
            <input
              type="password"
              className="form-control"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              disabled={loading}
            />
            <div className="invalid-feedback">Current password is required.</div>
          </div>
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
            <label className="form-label small fw-semibold">Confirm New Password</label>
            <input
              type="password"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              disabled={loading}
            />
            <div className="invalid-feedback">Please confirm your new password.</div>
          </div>
          <button
            type="submit"
            className="btn mk-btn-primary w-100 py-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Changing...
              </>
            ) : (
              "Change Password"
            )}
          </button>
        </form>

        <div className="text-center mt-3">
          <button
            className="btn btn-link text-decoration-none small"
            style={{ color: "var(--mk-pink)" }}
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
