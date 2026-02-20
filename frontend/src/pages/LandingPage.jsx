import { Link } from "react-router-dom";
import { isAuthenticated, getRolePath, getRole } from "../services/authService";
import logo from "../assets/logo.jpg";
import "./LandingPage.css";
import { useActiveSection } from "../hooks/useActiveSection";

export default function LandingPage() {
  const loggedIn = isAuthenticated();
  const sections = ["home", "about", "programs", "gallery", "contact"];
  const activeId = useActiveSection(sections);

  return (
    <div className="landing-page">
      {/* ==============================================================
          NAVBAR — sticky, mobile collapse, smooth-scroll links
          ============================================================== */}
      <nav
        className="navbar navbar-expand-lg sticky-top mk-navbar"
        id="top"
        aria-label="Main navigation"
      >
        <div className="container">
          <a
            className="navbar-brand d-flex align-items-center gap-2"
            href="#top"
          >
            <img src={logo} alt="MerryKids logo" />
            <span className="fw-bold fs-5" style={{ color: "var(--mk-blue)" }}>
              MerryKids Nursery
            </span>
          </a>

          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#landingNav"
            aria-controls="landingNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="landingNav">
            <ul className="navbar-nav mx-auto gap-1">
              <li className="nav-item">
                <a
                  className={`nav-link mk-nav-pill ${activeId === "home" ? "active" : ""}`}
                  href="#home"
                >
                  Home
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link mk-nav-pill ${activeId === "about" ? "active" : ""}`}
                  href="#about"
                >
                  About
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link mk-nav-pill ${activeId === "programs" ? "active" : ""}`}
                  href="#programs"
                >
                  Programs
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link mk-nav-pill ${activeId === "gallery" ? "active" : ""}`}
                  href="#gallery"
                >
                  Gallery
                </a>
              </li>
              <li className="nav-item">
                <a
                  className={`nav-link mk-nav-pill ${activeId === "contact" ? "active" : ""}`}
                  href="#contact"
                >
                  Contact
                </a>
              </li>
              <li className="nav-item">
                <Link to="/admissions" className="nav-link mk-nav-pill">
                  Admissions
                </Link>
              </li>
            </ul>

            <div className="d-flex align-items-center gap-2 mt-2 mt-lg-0">
              {loggedIn ? (
                <Link
                  to={getRolePath(getRole())}
                  className="btn mk-btn-primary btn-sm px-4"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <Link to="/login" className="btn mk-btn-primary btn-sm px-4">
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ==============================================================
          HERO SECTION
          ============================================================== */}
      <section className="mk-hero" id="home">
        <div className="container position-relative" style={{ zIndex: 1 }}>
          <div className="row justify-content-center">
            <div className="col-lg-8 col-xl-7">
              <div className="mk-hero-badge">
                &#127968; Welcome to MerryKids Nursery
              </div>
              <h1 className="mb-4">
                Where Every Child&apos;s
                <br />
                <span style={{ color: "#FCA5A5" }}>Journey Begins</span>
              </h1>
              <p className="lead mb-5">
                A warm, safe, and nurturing environment where curiosity thrives,
                friendships bloom, and every little one feels truly at home.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <a
                  href="#about"
                  className="btn btn-light btn-lg rounded-pill px-5 fw-semibold"
                  style={{ color: "var(--mk-blue)" }}
                >
                  Learn More
                </a>
                <Link
                  to="/login"
                  className="btn mk-btn-outline-white btn-lg px-5"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          ABOUT SECTION
          ============================================================== */}
      <section className="mk-section-py mk-section-white" id="about">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="mk-section-title">
              About <span>MerryKids</span>
            </h2>
            <p
              className="text-muted mt-2"
              style={{ maxWidth: "560px", margin: "0.5rem auto 0" }}
            >
              Since 2010, we have been a trusted home-away-from-home for
              children aged 6&nbsp;months to 5&nbsp;years, right in the heart of
              our community.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="mk-highlight-card">
                <span className="mk-card-icon">&#127968;</span>
                <h5>Safe Environment</h5>
                <p className="text-muted mb-0">
                  Fully secured premises, trained caregivers, and daily health
                  checks — so parents can leave with total peace of mind.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="mk-highlight-card">
                <span className="mk-card-icon">&#128218;</span>
                <h5>Engaging Learning</h5>
                <p className="text-muted mb-0">
                  Play-based curriculum that nurtures curiosity, creativity, and
                  early academic foundations through hands-on activities.
                </p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="mk-highlight-card">
                <span className="mk-card-icon">&#129309;</span>
                <h5>Strong Community</h5>
                <p className="text-muted mb-0">
                  A supportive network of parents, teachers, and families
                  working together for the growth of every child.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          PROGRAMS SECTION
          ============================================================== */}
      <section className="mk-section-py mk-section-surface" id="programs">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="mk-section-title">
              Our <span>Programs</span>
            </h2>
            <p
              className="text-muted mt-2"
              style={{ maxWidth: "520px", margin: "0.5rem auto 0" }}
            >
              Thoughtfully designed programs that grow with your child at every
              stage.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="mk-program-card">
                <div className="mk-program-card-header blue">
                  <span className="mk-program-icon">&#128118;</span>
                  <h5>Toddler Care</h5>
                </div>
                <div className="mk-program-card-body">
                  <p>
                    Gentle, nurturing care that supports early social and
                    emotional development through sensory play and routine.
                  </p>
                  <span className="mk-age-badge">Ages 6m – 2yrs</span>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="mk-program-card">
                <div className="mk-program-card-header pink">
                  <span className="mk-program-icon">&#127856;</span>
                  <h5>Preschool</h5>
                </div>
                <div className="mk-program-card-body">
                  <p>
                    Structured learning blended with creative play to prepare
                    children for school with confidence and joy.
                  </p>
                  <span className="mk-age-badge">Ages 3 – 4yrs</span>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="mk-program-card">
                <div className="mk-program-card-header slate">
                  <span className="mk-program-icon">&#127912;</span>
                  <h5>Activity Learning</h5>
                </div>
                <div className="mk-program-card-body">
                  <p>
                    Art, music, outdoor play, and STEM exploration that spark
                    imagination and build critical thinking skills.
                  </p>
                  <span className="mk-age-badge">Ages 4 – 5yrs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          GALLERY SECTION
          ============================================================== */}
      <section className="mk-section-py mk-section-white" id="gallery">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="mk-section-title">Gallery</h2>
            <p className="text-muted mt-2">
              A glimpse into our vibrant nursery life.
            </p>
          </div>

          <div className="row g-3">
            {[
              { label: "Arts & Crafts", variant: "v1" },
              { label: "Story Time", variant: "v2" },
              { label: "Outdoor Play", variant: "v3" },
              { label: "Music & Dance", variant: "v2" },
              { label: "Sensory Play", variant: "v1" },
              { label: "Garden Club", variant: "v3" },
            ].map(({ label, variant }) => (
              <div key={label} className="col-6 col-md-4">
                <div className={`mk-gallery-item ${variant}`}>
                  &#128247; {label}
                </div>
              </div>
            ))}
          </div>

          <p
            className="text-center text-muted mt-4"
            style={{ fontSize: "0.875rem" }}
          >
            Photo gallery coming soon — real photos will replace these
            placeholders.
          </p>
        </div>
      </section>

      {/* ==============================================================
          CONTACT SECTION
          ============================================================== */}
      <section className="mk-section-py mk-section-surface" id="contact">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="mk-section-title">
              Get in <span>Touch</span>
            </h2>
            <p className="text-muted mt-2">
              We&apos;d love to hear from you. Visit us or reach out any time.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-sm-6 col-lg-3">
              <div className="mk-contact-card">
                <span className="mk-contact-icon">&#128205;</span>
                <h6>Address</h6>
                <p>
                  123 Nursery Lane,
                  <br />
                  Sunshine District,
                  <br />
                  Colombo, Sri Lanka
                </p>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3">
              <div className="mk-contact-card">
                <span className="mk-contact-icon">&#128222;</span>
                <h6>Phone</h6>
                <p>
                  <a
                    href="tel:+94914387117"
                    className="text-decoration-none"
                    style={{ color: "var(--mk-blue)" }}
                  >
                    +94 914 387 117
                  </a>
                </p>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3">
              <div className="mk-contact-card">
                <span className="mk-contact-icon">&#9993;</span>
                <h6>Email</h6>
                <p>
                  <a
                    href="mailto:hello@merrykids.lk"
                    className="text-decoration-none"
                    style={{ color: "var(--mk-blue)" }}
                  >
                    hello@merrykids.lk
                  </a>
                </p>
              </div>
            </div>
            <div className="col-sm-6 col-lg-3">
              <div className="mk-contact-card">
                <span className="mk-contact-icon">&#128337;</span>
                <h6>Opening Hours</h6>
                <p>
                  Mon – Fri: 7:30 AM – 6:00 PM
                  <br />
                  Saturday: 8:00 AM – 1:00 PM
                </p>
              </div>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col">
              <div className="mk-map-embed">
                <div className="ratio ratio-21x9 rounded-4 overflow-hidden border">
                  <iframe
                    src="https://www.google.com/maps?q=6.234331,80.195276&z=16&output=embed"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Merry Kids International Montessori Location"
                    style={{ border: 0 }}
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================================================
          FOOTER
          ============================================================== */}
      <footer className="mk-footer">
        <div className="container">
          <div className="row align-items-center justify-content-between">
            <div className="col-md-4 mb-3 mb-md-0 text-center text-md-start">
              <div className="d-flex align-items-center gap-2 justify-content-center justify-content-md-start">
                <img
                  src={logo}
                  alt="MerryKids logo"
                  className="mk-footer-logo"
                />
                <div className="mk-footer-brand">
                  Merry Kids International Montessori
                </div>
              </div>

              <p className="mt-1 mb-0" style={{ fontSize: "0.85rem" }}>
                Growing little hearts and curious minds.
              </p>
            </div>

            <div className="col-md-4 mb-3 mb-md-0 text-center">
              <a
                href="https://www.facebook.com/merrykidsinternational"
                target="_blank"
                rel="noreferrer"
                className="mk-social-link"
                aria-label="Facebook"
              >
                f
              </a>
              <a
                href="tel:+94914387117"
                className="mk-social-link"
                aria-label="Call"
                title="Call us"
              >
                &#9742;
              </a>

              <a
                href="mailto:merrykidsinternational@gmail.com"
                className="mk-social-link"
                aria-label="Email"
                title="Email us"
              >
                &#9993;
              </a>
            </div>

            <div className="col-md-4 text-center text-md-end">
              <ul
                className="list-unstyled d-flex flex-wrap gap-3 justify-content-center justify-content-md-end mb-0"
                style={{ fontSize: "0.85rem" }}
              >
                <li>
                  <a
                    href="#about"
                    className="text-decoration-none"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#programs"
                    className="text-decoration-none"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    Programs
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="text-decoration-none"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="text-decoration-none"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    Staff Portal
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <p className="mk-copyright text-center mb-0">
            &copy; {new Date().getFullYear()} MerryKids Nursery. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
