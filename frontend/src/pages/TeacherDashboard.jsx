import DashboardNavbar from "../components/DashboardNavbar";

export default function TeacherDashboard() {
  return (
    <div className="min-vh-100" style={{ backgroundColor: "#f8faf8" }}>
      <DashboardNavbar />
      <div className="container py-4">
        <h2 className="fw-bold mb-1" style={{ color: "#4a6741" }}>Teacher Dashboard</h2>
        <p className="text-muted mb-4">Manage your classes and resources</p>

        <div className="row g-4">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <h5 className="fw-bold" style={{ color: "#4a6741" }}>Notices</h5>
              <p className="text-muted small mb-0">Create and manage notices for parents.</p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <h5 className="fw-bold" style={{ color: "#4a6741" }}>Resources</h5>
              <p className="text-muted small mb-0">Upload timetables, homework sheets, and materials.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
