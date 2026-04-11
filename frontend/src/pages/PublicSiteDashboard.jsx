import { useNavigate } from "react-router-dom";

const cards = [
  {
    title: "About Management",
    description: "Edit the About section heading, subtitle, and team cards.",
    path: "/admin/about-section",
    icon: "\u2139\uFE0F",
  },
  {
    title: "Programs Management",
    description: "Manage the Programs section content and program cards.",
    path: "/admin/programs",
    icon: "\uD83C\uDFAF",
  },
  {
    title: "Gallery Management",
    description: "Upload and manage photos shown in the public gallery.",
    path: "/admin/gallery",
    icon: "\uD83D\uDDBC\uFE0F",
  },
  {
    title: "Contact Management",
    description: "Update contact details, opening hours, and the map embed.",
    path: "/admin/contact",
    icon: "\uD83D\uDCDE",
  },
  {
    title: "Events Management",
    description: "Create and manage public events and announcements.",
    path: "/admin/events",
    icon: "\uD83D\uDCC5",
  },
  {
    title: "Admissions Management",
    description: "Review pending admission applications.",
    path: "/admin/admissions",
    icon: "\uD83D\uDCCB",
  },
];

export default function PublicSiteDashboard() {
  const navigate = useNavigate();

  return (
    <div>
      <h4 className="fw-bold mb-1" style={{ color: "var(--mk-blue)" }}>
        Public Site Management
      </h4>
      <p className="text-muted mb-4">Manage all public-facing website content</p>

      <div className="row g-4">
        {cards.map((card) => (
          <div key={card.title} className="col-md-6">
            <div
              className="card border-0 shadow-sm rounded-4 p-4 h-100"
              style={{
                cursor: "pointer",
                transition: "box-shadow 0.15s, transform 0.15s",
              }}
              onClick={() => navigate(card.path)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") navigate(card.path);
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(37,99,235,0.15)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "";
                e.currentTarget.style.transform = "";
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
    </div>
  );
}
