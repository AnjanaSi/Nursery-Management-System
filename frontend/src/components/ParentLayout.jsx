import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { logout, getEmail } from "../services/authService";
import logo from "../assets/logo.jpg";
import "./ParentLayout.css";

const menuItems = [
  { label: "Announcements", path: "/parent/announcements", icon: "📢" },
  { label: "Homework", path: "/parent/homework", icon: "📚" },
  { label: "My Child", path: "/parent/child-profile", icon: "👤" },
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
      <div className="parent-sidebar-brand">
        <img src={logo} alt="MerryKids logo" className="parent-sidebar-logo" />
        <div className="parent-sidebar-brand-text">
          MerryKids Parent Portal
        </div>
      </div>

      <nav className="parent-sidebar-nav flex-grow-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `parent-menu-item ${isActive ? "active" : ""}`
            }
            onClick={() => onNavClick?.()}
          >
            <span className="parent-menu-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="parent-sidebar-footer">
        <div className="parent-sidebar-email">{email}</div>
        <button className="btn btn-outline-secondary btn-sm w-100" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function ParentLayout() {
  return (
    <div className="parent-layout">
      {/* Mobile top bar */}
      <div className="parent-topbar d-lg-none">
        <button
          className="btn btn-link text-dark p-0"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#parentSidebar"
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
          <span className="fw-semibold" style={{ color: "var(--mk-blue)" }}>MerryKids Parent</span>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="parent-sidebar d-none d-lg-flex flex-column">
        <SidebarContent />
      </aside>

      {/* Mobile offcanvas sidebar */}
      <div
        className="offcanvas offcanvas-start d-lg-none"
        tabIndex={-1}
        id="parentSidebar"
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
              const el = document.getElementById("parentSidebar");
              if (el) {
                const offcanvas = window.bootstrap?.Offcanvas?.getInstance(el);
                offcanvas?.hide();
              }
            }}
          />
        </div>
      </div>

      {/* Main content */}
      <main className="parent-content">
        <Outlet />
      </main>
    </div>
  );
}
