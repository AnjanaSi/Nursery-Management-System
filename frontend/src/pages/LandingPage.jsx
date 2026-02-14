import { Link } from "react-router-dom";
import { isAuthenticated, getRolePath, getRole } from "../services/authService";

export default function LandingPage() {
  const loggedIn = isAuthenticated();

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
        <div className="container">
          <a className="navbar-brand fw-bold fs-4" href="/" style={{ color: "#4a6741" }}>
            MerryKids Nursery
          </a>
          <div className="ms-auto d-flex gap-2">
            {loggedIn ? (
              <Link to={getRolePath(getRole())} className="btn btn-success btn-sm rounded-pill px-3">
                Go to Dashboard
              </Link>
            ) : (
              <Link to="/login" className="btn btn-outline-success btn-sm rounded-pill px-3">
                Staff Login
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="py-5 text-center text-white"
        style={{
          background: "linear-gradient(135deg, #6b8f71 0%, #4a6741 100%)",
          minHeight: "420px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div className="container">
          <h1 className="display-4 fw-bold mb-3">Welcome to MerryKids Nursery</h1>
          <p className="lead mb-4" style={{ maxWidth: "600px", margin: "0 auto" }}>
            A warm, safe, and nurturing environment where every child&apos;s journey of
            learning and discovery begins.
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap">
            <a href="#features" className="btn btn-light btn-lg rounded-pill px-4 fw-semibold">
              Learn More
            </a>
            <Link to="/login" className="btn btn-outline-light btn-lg rounded-pill px-4">
              Staff Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-5" style={{ backgroundColor: "#f8faf8" }}>
        <div className="container">
          <h2 className="text-center fw-bold mb-2" style={{ color: "#4a6741" }}>
            Why Choose MerryKids?
          </h2>
          <p className="text-center text-muted mb-5">
            We provide the best care and education for your little ones.
          </p>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100 text-center p-4 rounded-4">
                <div className="mb-3">
                  <span style={{ fontSize: "3rem" }}>&#127968;</span>
                </div>
                <h5 className="fw-bold" style={{ color: "#4a6741" }}>Safe Environment</h5>
                <p className="text-muted">
                  A secure, child-friendly space designed for exploration and growth with
                  trained caregivers.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100 text-center p-4 rounded-4">
                <div className="mb-3">
                  <span style={{ fontSize: "3rem" }}>&#128218;</span>
                </div>
                <h5 className="fw-bold" style={{ color: "#4a6741" }}>Engaging Learning</h5>
                <p className="text-muted">
                  Play-based curriculum that nurtures creativity, curiosity, and
                  early academic skills.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-0 shadow-sm h-100 text-center p-4 rounded-4">
                <div className="mb-3">
                  <span style={{ fontSize: "3rem" }}>&#129309;</span>
                </div>
                <h5 className="fw-bold" style={{ color: "#4a6741" }}>Strong Community</h5>
                <p className="text-muted">
                  A supportive network of parents, teachers, and staff working
                  together for every child.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 text-center text-muted" style={{ backgroundColor: "#eef2ee" }}>
        <div className="container">
          <p className="mb-0">&copy; {new Date().getFullYear()} MerryKids Nursery. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
