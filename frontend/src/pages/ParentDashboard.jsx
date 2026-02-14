import DashboardNavbar from "../components/DashboardNavbar";

export default function ParentDashboard() {
  return (
    <div className="min-vh-100" style={{ backgroundColor: "#f8faf8" }}>
      <DashboardNavbar />
      <div className="container py-4">
        <h2 className="fw-bold mb-1" style={{ color: "#4a6741" }}>Parent Dashboard</h2>
        <p className="text-muted mb-4">Stay updated with your child&apos;s nursery</p>

        <div className="row g-4">
          <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <h5 className="fw-bold" style={{ color: "#4a6741" }}>Notices & Updates</h5>
              <p className="text-muted small mb-0">View latest announcements from teachers and staff.</p>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card border-0 shadow-sm rounded-4 p-4 h-100">
              <h5 className="fw-bold" style={{ color: "#4a6741" }}>Resources</h5>
              <p className="text-muted small mb-0">Download timetables, homework sheets, and more.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
