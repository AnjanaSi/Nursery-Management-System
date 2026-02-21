import { useNavigate } from "react-router-dom";
import StaffModuleHeader from "../components/StaffModuleHeader";
import "./StaffPages.css";

const cards = [
  {
    title: "Register New Teacher",
    description: "Add a new teacher record to the system.",
    path: "/admin/staff/new",
    icon: "➕",
  },
  {
    title: "Staff Directory",
    description: "View, search, and manage all staff records.",
    path: "/admin/staff/list",
    icon: "📋",
  },
];

export default function StaffLandingPage() {
  const navigate = useNavigate();

  return (
    <div>
      <StaffModuleHeader
        title="Staff Management"
        subtitle="Manage teacher records and portal access"
      />

      <div className="row g-4 mb-4">
        {cards.map((card) => (
          <div key={card.title} className="col-md-6">
            <div
              className="card staff-card p-4 h-100"
              onClick={() => navigate(card.path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate(card.path);
              }}
            >
              <div className="mb-2" style={{ fontSize: "1.8rem" }}>
                {card.icon}
              </div>
              <h5 className="fw-bold" style={{ color: "var(--mk-blue)" }}>
                {card.title}
              </h5>
              <p className="text-muted small mb-0">{card.description}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn btn-outline-secondary rounded-3"
        onClick={() => navigate("/admin")}
      >
        &larr; Back to Dashboard
      </button>
    </div>
  );
}
