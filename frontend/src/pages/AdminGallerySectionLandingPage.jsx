import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpg";
import "./AdminPages.css";

const cards = [
  {
    title: "Manage Gallery",
    description: "Edit the Gallery section heading, subtitle, and manage all photos with reordering.",
    path: "/admin/gallery/photos",
    icon: "🖼️",
  },
  {
    title: "Upload Photo",
    description: "Add a new photo to the public gallery.",
    path: "/admin/gallery/photos/upload",
    icon: "📷",
  },
];

export default function AdminGallerySectionLandingPage() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="admin-mgmt-header d-flex align-items-center gap-3">
        <img src={logo} alt="MerryKids" className="admin-mgmt-header-logo" />
        <div>
          <h5 className="fw-bold mb-0" style={{ color: "var(--mk-blue)" }}>
            Gallery Management
          </h5>
          <small className="text-muted">Manage the public Gallery section content and photos</small>
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
