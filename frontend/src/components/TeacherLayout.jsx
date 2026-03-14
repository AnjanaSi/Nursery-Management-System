import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { logout, getEmail } from "../services/authService";
import logo from "../assets/logo.jpg";
import "./TeacherLayout.css";

const menuItems = [
  { label: "Announcements", path: "/teacher/announcements", icon: "\uD83D\uDCE2" },
  { label: "Homework", path: "/teacher/homework", icon: "\uD83D\uDCDA" },
  { label: "Profile", path: "/teacher/profile", icon: "\uD83D\uDC64" },
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
      <div className="teacher-sidebar-brand">
        <img src={logo} alt="MerryKids logo" className="teacher-sidebar-logo" />
        <div className="teacher-sidebar-brand-text">
          MerryKids Teacher Portal
        </div>
      </div>

      <nav className="teacher-sidebar-nav flex-grow-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `teacher-menu-item ${isActive ? "active" : ""}`
            }
            onClick={() => onNavClick?.()}
          >
            <span className="teacher-menu-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="teacher-sidebar-footer">
        <div className="teacher-sidebar-email">{email}</div>
        <button className="btn btn-outline-secondary btn-sm w-100" onClick={handleLogout}>
          Sign Out
        </button>
      </div>
    </div>
  );
}

export default function TeacherLayout() {
  return (
    <div className="teacher-layout">
      {/* Mobile top bar */}
      <div className="teacher-topbar d-lg-none">
        <button
          className="btn btn-link text-dark p-0"
          type="button"
          data-bs-toggle="offcanvas"
          data-bs-target="#teacherSidebar"
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
          <span className="fw-semibold" style={{ color: "var(--mk-blue)" }}>MerryKids Teacher</span>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="teacher-sidebar d-none d-lg-flex flex-column">
        <SidebarContent />
      </aside>

      {/* Mobile offcanvas sidebar */}
      <div
        className="offcanvas offcanvas-start d-lg-none"
        tabIndex={-1}
        id="teacherSidebar"
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
              const el = document.getElementById("teacherSidebar");
              if (el) {
                const offcanvas = window.bootstrap?.Offcanvas?.getInstance(el);
                offcanvas?.hide();
              }
            }}
          />
        </div>
      </div>

      {/* Main content */}
      <main className="teacher-content">
        <Outlet />
      </main>
    </div>
  );
}
