import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  login,
  isAuthenticated,
  getRole,
  getRolePath,
} from "../services/authService";
import logo from "../assets/logo.jpg";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      const role = getRole();
      if (role) {
        navigate(getRolePath(role), { replace: true });
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidated(true);
    setError("");

    if (!email || !password) return;

    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.mustChangePassword) {
        navigate("/change-password", { replace: true });
      } else {
        navigate(getRolePath(data.role), { replace: true });
      }
    } catch (err) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Invalid email or password.";
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
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-sm-10 col-md-8 col-lg-5 col-xl-4">
            <div className="card border-0 shadow rounded-4 p-4">
              <div className="card-body">
                <div className="text-center mb-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3 overflow-hidden"
                    style={{
                      width: "72px",
                      height: "72px",
                      backgroundColor: "var(--mk-blue)",
                    }}
                  >
                    <img
                      src={logo}
                      alt="MerryKids"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </div>
                  <h4 className="fw-bold" style={{ color: "var(--mk-blue)" }}>
                    MerryKids Portal
                  </h4>
                  <p className="text-muted small">Sign in to your account</p>
                </div>

                {error && (
                  <div
                    className="alert alert-danger py-2 rounded-3"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                <form
                  noValidate
                  className={validated ? "was-validated" : ""}
                  onSubmit={handleSubmit}
                >
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-semibold">
                      Email address
                    </label>
                    <input
                      type="email"
                      className="form-control rounded-3"
                      id="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <div className="invalid-feedback">
                      Please enter your email.
                    </div>
                  </div>

                  <div className="mb-2">
                    <label
                      htmlFor="password"
                      className="form-label fw-semibold"
                    >
                      Password
                    </label>
                    <input
                      type="password"
                      className="form-control rounded-3"
                      id="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                    <div className="invalid-feedback">
                      Please enter your password.
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mb-3">
                    <Link
                      to="/forgot-password"
                      className="text-decoration-none small"
                      style={{ color: "var(--mk-pink)" }}
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    className="btn mk-btn-primary w-100 py-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <Link
                    to="/"
                    className="text-decoration-none"
                    style={{ color: "var(--mk-blue)" }}
                  >
                    &larr; Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
