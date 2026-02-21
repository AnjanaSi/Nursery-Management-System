import "./StaffModuleHeader.css";

export default function StaffModuleHeader({ title, subtitle }) {
  return (
    <div className="staff-module-header mb-4">
      <div className="d-flex align-items-center gap-3">
        <img
          src="/logo.png"
          alt="Merry Kids Logo"
          className="staff-header-logo"
        />
        <div>
          <div className="staff-header-brand">
            Merry Kids International Montessori
          </div>
          {title && <h5 className="staff-header-title mb-0 mt-1">{title}</h5>}
          {subtitle && (
            <p className="text-muted small mb-0 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="staff-header-divider mt-3" />
    </div>
  );
}
