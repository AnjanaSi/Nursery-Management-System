import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpg";
import "./AdminPages.css";

const cards = [
  {
    title: "Manage Section Content",
    description: "Edit the Programs section heading, subtitle, and manage all program cards.",
    path: "/admin/programs/cards",
    icon: "✏️",
  },
  {
    title: "Add New Card",
    description: "Create a new program card with a title, description, age range, and image.",
    path: "/admin/programs/cards/new",
    icon: "➕",
  },
];

export default function AdminProgramSectionLandingPage() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="admin-mgmt-header d-flex align-items-center gap-3">
        <img src={logo} alt="MerryKids" className="admin-mgmt-header-logo" />
        <div>
          <h5 className="fw-bold mb-0" style={{ color: "var(--mk-blue)" }}>
            Programs Section Management
          </h5>
          <small className="text-muted">Manage the public Programs section content and cards</small>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {cards.map((card) => (
          <div key={card.title} className="col-md-6">
            <div
              className="card admin-mgmt-card p-4 h-100"
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
        onClick={() => navigate("/admin/public-site")}
      >
        &larr; Back to Public Site
      </button>
    </div>
  );
}
