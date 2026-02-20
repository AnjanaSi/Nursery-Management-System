import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { logout, getEmail } from "../services/authService";
import logo from "../assets/logo.jpg";
import "./AdminLayout.css";

const menuItems = [
  { label: "Dashboard", path: "/admin", icon: "\u2302" },
  { label: "Admissions", path: "/admin/admissions", icon: "\uD83D\uDCCB" },
  { label: "Staff", path: "/admin/staff", icon: "\uD83D\uDC65", disabled: true },
  { label: "Students", path: "/admin/students", icon: "\uD83C\uDF93", disabled: true },
  { label: "Parents", path: "/admin/parents", icon: "\uD83C\uDFE0", disabled: true },
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
          Merry Kids International Montessori
        </div>
      </div>

      <nav className="admin-sidebar-nav flex-grow-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.disabled ? "#" : item.path}
            end={item.path === "/admin"}
            className={({ isActive }) =>
              `admin-menu-item ${isActive && !item.disabled ? "active" : ""} ${item.disabled ? "disabled" : ""}`
            }
            onClick={(e) => {
              if (item.disabled) {
                e.preventDefault();
                return;
              }
              onNavClick?.();
            }}
          >
            <span className="admin-menu-icon">{item.icon}</span>
            {item.label}
            {item.disabled && (
              <span className="badge bg-light text-muted ms-auto" style={{ fontSize: "0.65rem" }}>
                Soon
              </span>
            )}
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

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      {/* Mobile top bar */}
      <div className="admin-topbar d-lg-none">
        <button
          className="btn btn-link text-dark p-0"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#adminSidebar"
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
          <span className="fw-semibold" style={{ color: "var(--mk-blue)" }}>MerryKids Admin</span>
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
        id="adminSidebar"
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
              const el = document.getElementById("adminSidebar");
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
