import DashboardNavbar from "../components/DashboardNavbar";

export default function AdminDashboard() {
  return (
    <div className="min-vh-100" style={{ backgroundColor: "#f8faf8" }}>
      <DashboardNavbar />
      <div className="container py-4">
        <h2 className="fw-bold mb-1" style={{ color: "#4a6741" }}>Admin Dashboard</h2>
        <p className="text-muted mb-4">Manage your nursery operations</p>

        <div className="row g-4">
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <h5 className="fw-bold" style={{ color: "#4a6741" }}>Staff Management</h5>
              <p className="text-muted small mb-0">Add, edit, and manage staff members.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <h5 className="fw-bold" style={{ color: "#4a6741" }}>Student Management</h5>
              <p className="text-muted small mb-0">Manage enrolled students and records.</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <h5 className="fw-bold" style={{ color: "#4a6741" }}>Admissions</h5>
              <p className="text-muted small mb-0">Review pending admission applications.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
