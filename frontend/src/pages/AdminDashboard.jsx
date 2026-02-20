import { useNavigate } from "react-router-dom";

const cards = [
  {
    title: "Staff Management",
    description: "Add, edit, and manage staff members.",
    path: "/admin/staff",
    icon: "\uD83D\uDC65",
    disabled: true,
  },
  {
    title: "Student Management",
    description: "Manage enrolled students and records.",
    path: "/admin/students",
    icon: "\uD83C\uDF93",
    disabled: true,
  },
  {
    title: "Admissions",
    description: "Review pending admission applications.",
    path: "/admin/admissions",
    icon: "\uD83D\uDCCB",
    disabled: false,
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div>
      <h4 className="fw-bold mb-1" style={{ color: "var(--mk-blue)" }}>
        Admin Dashboard
      </h4>
      <p className="text-muted mb-4">Manage your nursery operations</p>

      <div className="row g-4">
        {cards.map((card) => (
          <div key={card.title} className="col-md-4">
            <div
              className="card border-0 shadow-sm rounded-4 p-4 h-100"
              style={{
                cursor: card.disabled ? "default" : "pointer",
                transition: "box-shadow 0.15s, transform 0.15s",
              }}
              onClick={() => !card.disabled && navigate(card.path)}
              role={card.disabled ? undefined : "button"}
              tabIndex={card.disabled ? undefined : 0}
              onKeyDown={(e) => {
                if (!card.disabled && (e.key === "Enter" || e.key === " ")) {
                  navigate(card.path);
                }
              }}
              onMouseEnter={(e) => {
                if (!card.disabled) {
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(37,99,235,0.15)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
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
              {card.disabled && (
                <span
                  className="badge mt-2"
                  style={{
                    background: "var(--mk-pink-light)",
                    color: "var(--mk-pink)",
                    fontSize: "0.7rem",
                  }}
                >
                  Coming Soon
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
