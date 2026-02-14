import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  login,
  isAuthenticated,
  getRole,
  getRolePath,
} from "../services/authService";

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
      navigate(getRolePath(data.role), { replace: true });
    } catch (err) {
      const message =
        err?.response?.data?.error || // <-- ApiResponse uses "error"
        err?.response?.data?.message || // fallback if you ever add message later
        "Invalid email or password."; // friendly default

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        background: "linear-gradient(135deg, #e8f0e8 0%, #d4e4d4 100%)",
      }}
    >
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-sm-10 col-md-8 col-lg-5 col-xl-4">
            <div className="card border-0 shadow rounded-4 p-4">
              <div className="card-body">
                {/* Logo placeholder */}
                <div className="text-center mb-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                    style={{
                      width: "72px",
                      height: "72px",
                      backgroundColor: "#4a6741",
                      color: "#fff",
                      fontSize: "2rem",
                    }}
                  >
                    MK
                  </div>
                  <h4 className="fw-bold" style={{ color: "#4a6741" }}>
                    MerryKids Portal
                  </h4>
                  <p className="text-muted small">Sign in to your account</p>
                </div>

                {/* Error alert */}
                {error && (
                  <div
                    className="alert alert-danger py-2 rounded-3"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

                {/* Login form */}
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

                  <div className="mb-4">
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

                  <button
                    type="submit"
                    className="btn w-100 text-white fw-semibold rounded-3 py-2"
                    style={{ backgroundColor: "#4a6741" }}
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
                    style={{ color: "#4a6741" }}
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
