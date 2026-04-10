import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isAuthenticated, getRolePath, getRole } from "../services/authService";
import logo from "../assets/logo.jpg";
import "./LandingPage.css";
import { useActiveSection } from "../hooks/useActiveSection";
import { getPublicAbout, getAboutCardImageUrl } from "../services/api/aboutSectionService";
import { getPublicPrograms, getProgramCardImageUrl } from "../services/api/programSectionService";
import { getPublicGallery, getGalleryPhotoImageUrl } from "../services/api/gallerySectionService";

export default function LandingPage() {
  const loggedIn = isAuthenticated();
  const navigate = useNavigate();
  const sections = ["home", "about", "programs", "gallery", "contact"];
  const activeId = useActiveSection(sections);

  const [aboutData, setAboutData] = useState(null);
  const [aboutLoading, setAboutLoading] = useState(true);
  const [aboutError, setAboutError] = useState(false);
  const [showAllCards, setShowAllCards] = useState(false);

  const [programData, setProgramData] = useState(null);
  const [programLoading, setProgramLoading] = useState(true);
  const [programError, setProgramError] = useState(false);
  const [showAllPrograms, setShowAllPrograms] = useState(false);

  const [galleryData, setGalleryData] = useState(null);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [galleryError, setGalleryError] = useState(false);

  useEffect(() => {
    getPublicAbout()
      .then((res) => setAboutData(res.data))
      .catch(() => setAboutError(true))
      .finally(() => setAboutLoading(false));
    getPublicPrograms()
      .then((res) => setProgramData(res.data))
      .catch(() => setProgramError(true))
      .finally(() => setProgramLoading(false));
    getPublicGallery()
      .then((res) => setGalleryData(res.data))
      .catch(() => setGalleryError(true))
      .finally(() => setGalleryLoading(false));
  }, []);

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
              Merry Kids International Montessori
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
                <Link to="/events" className="nav-link mk-nav-pill">
                  Events
                </Link>
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
          ABOUT SECTION — dynamic, admin-managed
          ============================================================== */}
      <section className="mk-section-py mk-section-white" id="about">
        <div className="container">
          {/* Heading & subtitle */}
          <div className="text-center mb-5">
            {aboutLoading ? (
              <>
                <div className="mk-skeleton mx-auto mb-3" style={{ height: 36, maxWidth: 280, borderRadius: 8 }} />
                <div className="mk-skeleton mx-auto" style={{ height: 20, maxWidth: 480, borderRadius: 6 }} />
              </>
            ) : aboutError ? (
              <div className="text-center py-3">
                <p className="text-danger small mb-0">Unable to load About section content.</p>
              </div>
            ) : (
              <>
                <h2 className="mk-section-title">
                  {aboutData?.config?.sectionTitle || "About MerryKids"}
                </h2>
                <p
                  className="text-muted mt-2"
                  style={{ maxWidth: "560px", margin: "0.5rem auto 0" }}
                >
                  {aboutData?.config?.subtitle}
                </p>
              </>
            )}
          </div>

          {/* Cards */}
          {aboutLoading ? (
            <div className="row g-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="col-md-4">
                  <div className="mk-highlight-card">
                    <div className="mk-skeleton mb-3" style={{ height: 180, borderRadius: 10 }} />
                    <div className="mk-skeleton mb-2" style={{ height: 22, width: "60%" }} />
                    <div className="mk-skeleton" style={{ height: 60, width: "100%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : aboutError ? null : (
            <>
              {(() => {
                const allCards = aboutData?.cards ?? [];
                const visibleCards = showAllCards ? allCards : allCards.slice(0, 3);
                return (
                  <>
                    <div className="row g-4">
                      {visibleCards.map((card) => (
                        <div key={card.id} className="col-md-4">
                          <div className="mk-highlight-card">
                            {card.imageUrl ? (
                              <img
                                src={getAboutCardImageUrl(card.id)}
                                alt={card.title}
                                className="mk-about-card-img"
                              />
                            ) : (
                              <div className="mk-about-card-img-placeholder" />
                            )}
                            <h5>{card.title}</h5>
                            <p className="text-muted mb-0">{card.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {allCards.length > 3 && (
                      <div className="text-center mt-4">
                        <button
                          className="btn btn-outline-primary rounded-pill px-4"
                          onClick={() => setShowAllCards((prev) => !prev)}
                        >
                          {showAllCards ? "See Less" : "See More"}
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      </section>

      {/* ==============================================================
          PROGRAMS SECTION — dynamic, admin-managed
          ============================================================== */}
      <section className="mk-section-py mk-section-surface" id="programs">
        <div className="container">
          {/* Heading & subtitle */}
          <div className="text-center mb-5">
            {programLoading ? (
              <>
                <div className="mk-skeleton mx-auto mb-3" style={{ height: 36, maxWidth: 280, borderRadius: 8 }} />
                <div className="mk-skeleton mx-auto" style={{ height: 20, maxWidth: 480, borderRadius: 6 }} />
              </>
            ) : programError ? (
              <div className="text-center py-3">
                <p className="text-danger small mb-0">Unable to load Programs section content.</p>
              </div>
            ) : (
              <>
                <h2 className="mk-section-title">
                  {programData?.config?.sectionTitle || "Our Programs"}
                </h2>
                <p
                  className="text-muted mt-2"
                  style={{ maxWidth: "520px", margin: "0.5rem auto 0" }}
                >
                  {programData?.config?.subtitle}
                </p>
              </>
            )}
          </div>

          {/* Cards */}
          {programLoading ? (
            <div className="row g-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="col-md-4">
                  <div className="mk-highlight-card">
                    <div className="mk-skeleton mb-3" style={{ height: 180, borderRadius: 10 }} />
                    <div className="mk-skeleton mb-2" style={{ height: 22, width: "60%" }} />
                    <div className="mk-skeleton" style={{ height: 60, width: "100%" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : programError ? null : (
            <>
              {(() => {
                const allCards = programData?.cards ?? [];
                const visibleCards = showAllPrograms ? allCards : allCards.slice(0, 3);
                return (
                  <>
                    <div className="row g-4">
                      {visibleCards.map((card) => (
                        <div key={card.id} className="col-md-4">
                          <div className="mk-program-card">
                            {card.imageUrl ? (
                              <img
                                src={getProgramCardImageUrl(card.id)}
                                alt={card.title}
                                className="mk-about-card-img"
                              />
                            ) : (
                              <div className="mk-about-card-img-placeholder" />
                            )}
                            <div className="mk-program-card-body">
                              <h5 className="fw-bold mb-2">{card.title}</h5>
                              <p className="text-muted mb-3">{card.description}</p>
                              <span className="mk-age-badge">{card.ageRange}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {allCards.length > 3 && (
                      <div className="text-center mt-4">
                        <button
                          className="btn btn-outline-primary rounded-pill px-4"
                          onClick={() => setShowAllPrograms((prev) => !prev)}
                        >
                          {showAllPrograms ? "See Less" : "See More"}
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </div>
      </section>

      {/* ==============================================================
          GALLERY SECTION
          ============================================================== */}
      <section className="mk-section-py mk-section-white" id="gallery">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="mk-section-title">
              {galleryData?.config?.sectionTitle ?? "Gallery"}
            </h2>
            {(galleryData?.config?.subtitle || !galleryLoading) && (
              <p className="text-muted mt-2">
                {galleryData?.config?.subtitle ?? "A glimpse into our vibrant nursery life."}
              </p>
            )}
          </div>

          {galleryLoading ? (
            /* Skeleton */
            <div className="row g-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="col-4 col-md-3 col-lg-2">
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "1/1",
                      borderRadius: 10,
                      background: "linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)",
                      backgroundSize: "200% 100%",
                      animation: "skeleton-shimmer 1.4s infinite",
                    }}
                  />
                </div>
              ))}
            </div>
          ) : galleryError ? (
            <p className="text-center text-muted">Unable to load gallery right now.</p>
          ) : galleryData?.photos?.length === 0 ? (
            <p className="text-center text-muted">No photos yet — check back soon.</p>
          ) : (
            <>
              <div className="row g-3">
                {galleryData.photos.slice(0, 6).map((photo, idx) => (
                  <div key={photo.id} className="col-4 col-md-3 col-lg-2">
                    <div
                      className="mk-gallery-photo-item"
                      onClick={() => navigate("/gallery")}
                      role="button"
                      tabIndex={0}
                      aria-label={`Gallery photo ${idx + 1}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") navigate("/gallery");
                      }}
                    >
                      <img
                        src={getGalleryPhotoImageUrl(photo.id)}
                        alt={`Gallery photo ${idx + 1}`}
                        className="mk-gallery-photo-img"
                        loading="lazy"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {galleryData.photos.length > 6 && (
                <div className="text-center mt-4">
                  <button
                    className="btn btn-outline-primary rounded-pill px-4"
                    onClick={() => navigate("/gallery")}
                  >
                    See More
                  </button>
                </div>
              )}
            </>
          )}
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
