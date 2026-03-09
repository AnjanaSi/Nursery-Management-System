import { useNavigate } from "react-router-dom";
import "./StudentPages.css";

const cards = [
  {
    title: "Register New Student",
    description: "Enroll a new student with guardian details.",
    path: "/admin/students/new",
    icon: "➕",
  },
  {
    title: "Student Directory",
    description: "View, search, and manage all student records.",
    path: "/admin/students/list",
    icon: "📋",
  },
  {
    title: "Year Transition",
    description: "Promote students or process year-end exits.",
    path: "/admin/students/year-transition",
    icon: "📅",
  },
];

export default function StudentsLandingPage() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1" style={{ color: "var(--mk-blue)" }}>
          Student Management
        </h4>
        <p className="text-muted mb-0">Manage student records, guardians, and year transitions</p>
      </div>

      <div className="row g-4 mb-4">
        {cards.map((card) => (
          <div key={card.title} className="col-md-4">
            <div
              className="card student-card p-4 h-100"
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
