import { useNavigate } from "react-router-dom";
import { logout, getEmail, getRole } from "../services/authService";

export default function DashboardNavbar() {
  const navigate = useNavigate();
  const email = getEmail();
  const role = getRole();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const roleBadgeColor = {
    ADMIN: "bg-danger",
    TEACHER: "bg-info",
    PARENT: "bg-success",
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark" style={{ backgroundColor: "#4a6741" }}>
      <div className="container">
        <a className="navbar-brand fw-bold" href="/">
          MerryKids
        </a>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#dashboardNav"
          aria-controls="dashboardNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="dashboardNav">
          <ul className="navbar-nav ms-auto align-items-lg-center gap-2">
            <li className="nav-item">
              <span className={`badge ${roleBadgeColor[role] || "bg-secondary"} rounded-pill`}>
                {role}
              </span>
            </li>
            <li className="nav-item">
              <span className="nav-link text-light" style={{ opacity: 0.85 }}>
                {email}
              </span>
            </li>
            <li className="nav-item">
              <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
