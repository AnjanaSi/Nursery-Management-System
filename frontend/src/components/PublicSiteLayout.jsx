import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { logout, getEmail } from "../services/authService";
import logo from "../assets/logo.jpg";
import "./AdminLayout.css";

const menuItems = [
  { label: "About Management",      path: "/admin/about-section", icon: "\u2139\uFE0F" },
  { label: "Programs Management",   path: "/admin/programs",      icon: "\uD83C\uDFAF" },
  { label: "Gallery Management",    path: "/admin/gallery",       icon: "\uD83D\uDDBC\uFE0F" },
  { label: "Contact Management",    path: "/admin/contact",       icon: "\uD83D\uDCDE" },
  { label: "Events Management",     path: "/admin/events",        icon: "\uD83D\uDCC5" },
  { label: "Admissions Management", path: "/admin/admissions",    icon: "\uD83D\uDCCB" },
];

function SidebarContent({ onNavClick }) {
  const navigate = useNavigate();
  const email = getEmail();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="d-flex flex-column h-100">
      <div className="admin-sidebar-brand">
        <img src={logo} alt="MerryKids logo" className="admin-sidebar-logo" />
        <div className="admin-sidebar-brand-text">
          Public Site Management
        </div>
      </div>

      <nav className="admin-sidebar-nav flex-grow-1">
        {/* Back to main admin */}
        <button
          className="admin-menu-item w-100 border-0 bg-transparent text-start mb-1"
          style={{ color: "var(--mk-text-muted)", fontWeight: 500 }}
          onClick={() => {
            onNavClick?.();
            navigate("/admin");
          }}
        >
          <span className="admin-menu-icon">&larr;</span>
          Main Dashboard
        </button>

        <div
          style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "var(--mk-text-muted)",
            textTransform: "uppercase",
            padding: "0.5rem 1rem 0.25rem",
            opacity: 0.7,
          }}
        >
          Public Website
        </div>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `admin-menu-item ${isActive ? "active" : ""}`
            }
            onClick={() => onNavClick?.()}
          >
            <span className="admin-menu-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="admin-sidebar-footer">
        <div className="admin-sidebar-email">{email}</div>
        <button className="btn btn-outline-secondary btn-sm w-100" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function PublicSiteLayout() {
  return (
    <div className="admin-layout">
      {/* Mobile top bar */}
      <div className="admin-topbar d-lg-none">
        <button
          className="btn btn-link text-dark p-0"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#publicSiteSidebar"
          aria-label="Toggle sidebar"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="d-flex align-items-center gap-2">
          <img src={logo} alt="MerryKids" style={{ height: 28, borderRadius: 6 }} />
          <span className="fw-semibold" style={{ color: "var(--mk-blue)" }}>Public Site</span>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="admin-sidebar d-none d-lg-flex flex-column">
        <SidebarContent />
      </aside>

      {/* Mobile offcanvas sidebar */}
      <div
        className="offcanvas offcanvas-start d-lg-none"
        tabIndex={-1}
        id="publicSiteSidebar"
        style={{ width: 260 }}
      >
        <div className="offcanvas-header pb-0">
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          />
        </div>
        <div className="offcanvas-body p-0" style={{ height: "calc(100% - 48px)" }}>
          <SidebarContent
            onNavClick={() => {
              const el = document.getElementById("publicSiteSidebar");
              if (el) {
                const offcanvas = window.bootstrap?.Offcanvas?.getInstance(el);
                offcanvas?.hide();
              }
            }}
          />
        </div>
      </div>

      {/* Main content */}
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
