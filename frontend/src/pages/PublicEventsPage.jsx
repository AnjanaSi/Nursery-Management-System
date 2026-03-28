import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { isAuthenticated, getRolePath, getRole } from "../services/authService";
import {
  getPublicEvents,
  getPublicEventById,
  getEventPhotoUrl,
} from "../services/api/eventsService";
import logo from "../assets/logo.jpg";
import "./LandingPage.css";
import "./PublicEventsPage.css";

export default function PublicEventsPage() {
  const loggedIn = isAuthenticated();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  const detailModalRef = useRef(null);
  const detailModalInstance = useRef(null);

  const fetchEvents = useCallback(async (page = 0) => {
    setLoading(true);
    setError("");
    try {
      const res = await getPublicEvents({ page, size: 9 });
      const pg = res.data;
      setEvents(pg.content || []);
      setTotalPages(pg.totalPages || 0);
      setCurrentPage(pg.number || 0);
    } catch {
      setError("Failed to load events. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents(0);
  }, [fetchEvents]);

  useEffect(() => {
    if (detailModalRef.current) {
      detailModalInstance.current = new window.bootstrap.Modal(detailModalRef.current);
    }
    return () => detailModalInstance.current?.dispose();
  }, []);

  const openDetail = async (ev) => {
    setSelectedEvent({ ...ev, photos: [] });
    setModalLoading(true);
    setModalError("");
    detailModalInstance.current?.show();
    try {
      const res = await getPublicEventById(ev.id);
      setSelectedEvent(res.data);
    } catch {
      setModalError("Failed to load event details.");
    } finally {
      setModalLoading(false);
    }
  };

  const formatEventDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr + "T00:00:00").toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages = [];
    for (let i = 0; i < totalPages; i++) {
      if (i === 0 || i === totalPages - 1 || (i >= currentPage - 2 && i <= currentPage + 2)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== -1) {
        pages.push(-1);
      }
    }
    return (
      <nav className="d-flex justify-content-center mt-4 mb-2">
        <ul className="pagination mb-0">
          <li className={`page-item ${currentPage === 0 ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => fetchEvents(currentPage - 1)}>
              &laquo;
            </button>
          </li>
          {pages.map((p, idx) =>
            p === -1 ? (
              <li key={`e${idx}`} className="page-item disabled">
                <span className="page-link">&hellip;</span>
              </li>
            ) : (
              <li key={p} className={`page-item ${p === currentPage ? "active" : ""}`}>
                <button className="page-link" onClick={() => fetchEvents(p)}>
                  {p + 1}
                </button>
              </li>
            )
          )}
          <li className={`page-item ${currentPage >= totalPages - 1 ? "disabled" : ""}`}>
            <button className="page-link" onClick={() => fetchEvents(currentPage + 1)}>
              &raquo;
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <div className="landing-page">
      {/* ── Navbar (same visual style as LandingPage) ── */}
      <nav className="navbar navbar-expand-lg sticky-top mk-navbar" aria-label="Main navigation">
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
            <img src={logo} alt="MerryKids logo" />
            <span className="fw-bold fs-5" style={{ color: "var(--mk-blue)" }}>
              Merry Kids International Montessori
            </span>
          </Link>

          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#eventsNav"
            aria-controls="eventsNav"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="eventsNav">
            <ul className="navbar-nav mx-auto gap-1">
              <li className="nav-item">
                <Link className="nav-link mk-nav-pill" to="/">
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link mk-nav-pill active" to="/events">
                  Events
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link mk-nav-pill" to="/admissions">
                  Admissions
                </Link>
              </li>
            </ul>
            <div className="d-flex align-items-center gap-2 mt-2 mt-lg-0">
              {loggedIn ? (
                <Link to={getRolePath(getRole())} className="btn mk-btn-primary btn-sm px-4">
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

      {/* ── Hero ── */}
      <div className="ev-page-hero">
        <div className="container text-center">
          <h1>Our Events</h1>
          <p className="lead mb-0" style={{ opacity: 0.85 }}>
            Celebrations, milestones, and memories from the MerryKids community
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="container pb-5">
        {error && (
          <div className="alert alert-danger rounded-4 text-center">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <span className="spinner-border text-primary" style={{ width: "2.5rem", height: "2.5rem" }} />
          </div>
        ) : events.length === 0 ? (
          <div className="ev-empty-state">
            <div className="ev-empty-state-icon">📅</div>
            <h4 className="fw-bold mb-2">No Events Yet</h4>
            <p>No events have been published yet. Check back soon!</p>
          </div>
        ) : (
          <>
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
              {events.map((ev) => (
                <div key={ev.id} className="col">
                  <div className="card ev-card h-100" onClick={() => openDetail(ev)}>
                    {ev.coverPhotoId ? (
                      <img
                        src={getEventPhotoUrl(ev.coverPhotoId)}
                        alt={ev.title}
                        className="ev-cover-img"
                      />
                    ) : (
                      <div className="ev-cover-placeholder">📸</div>
                    )}
                    <div className="card-body">
                      <span className="ev-date-badge">{formatEventDate(ev.eventDate)}</span>
                      <h5 className="card-title fw-bold mb-2">{ev.title}</h5>
                      <p className="ev-card-desc">{ev.description}</p>
                    </div>
                    <div className="card-footer bg-transparent border-0 pb-3 pt-0 px-3">
                      <button
                        className="btn btn-sm mk-btn-primary w-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetail(ev);
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {renderPagination()}
          </>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="mk-footer">
        <div className="container">
          <div className="row align-items-center justify-content-between">
            <div className="col-md-6 mb-2 mb-md-0">
              <div className="d-flex align-items-center gap-2">
                <img src={logo} alt="MerryKids" className="mk-footer-logo" />
                <span className="mk-footer-brand">Merry Kids International Montessori</span>
              </div>
            </div>
            <div className="col-md-6 text-md-end">
              <Link to="/" className="text-decoration-none me-3" style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>
                Home
              </Link>
              <Link to="/admissions" className="text-decoration-none" style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>
                Admissions
              </Link>
            </div>
          </div>
          <p className="mk-copyright text-center mb-0">
            &copy; {new Date().getFullYear()} MerryKids Nursery. All rights reserved.
          </p>
        </div>
      </footer>

      {/* ── Event Detail Modal ── */}
      <div className="modal fade" ref={detailModalRef} tabIndex={-1}>
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content rounded-4">
            <div className="modal-header border-0 pb-0">
              <div>
                <h5 className="modal-title fw-bold" style={{ color: "var(--mk-blue)" }}>
                  {selectedEvent?.title}
                </h5>
                {selectedEvent?.eventDate && (
                  <p className="text-muted small mb-0">
                    {formatEventDate(selectedEvent.eventDate)}
                  </p>
                )}
              </div>
              <button type="button" className="btn-close ms-auto" data-bs-dismiss="modal" />
            </div>

            <div className="modal-body">
              {modalLoading ? (
                <div className="text-center py-4">
                  <span className="spinner-border text-primary" />
                </div>
              ) : modalError ? (
                <div className="alert alert-danger">{modalError}</div>
              ) : (
                <>
                  {/* Photo Carousel */}
                  {selectedEvent?.photos && selectedEvent.photos.length > 0 && (
                    <div
                      id={`ev-carousel-${selectedEvent.id}`}
                      className="carousel slide mb-4 rounded-3 overflow-hidden"
                      data-bs-ride="false"
                    >
                      <div className="carousel-inner">
                        {selectedEvent.photos.map((photo, idx) => (
                          <div
                            key={photo.id}
                            className={`carousel-item ${idx === 0 ? "active" : ""}`}
                          >
                            <img
                              src={getEventPhotoUrl(photo.id)}
                              className="ev-carousel-img d-block"
                              alt={photo.originalFileName}
                            />
                          </div>
                        ))}
                      </div>
                      {selectedEvent.photos.length > 1 && (
                        <>
                          <button
                            className="carousel-control-prev"
                            type="button"
                            data-bs-target={`#ev-carousel-${selectedEvent.id}`}
                            data-bs-slide="prev"
                          >
                            <span className="carousel-control-prev-icon" />
                            <span className="visually-hidden">Previous</span>
                          </button>
                          <button
                            className="carousel-control-next"
                            type="button"
                            data-bs-target={`#ev-carousel-${selectedEvent.id}`}
                            data-bs-slide="next"
                          >
                            <span className="carousel-control-next-icon" />
                            <span className="visually-hidden">Next</span>
                          </button>
                          <div className="carousel-indicators position-relative mt-2">
                            {selectedEvent.photos.map((_, idx) => (
                              <button
                                key={idx}
                                type="button"
                                data-bs-target={`#ev-carousel-${selectedEvent.id}`}
                                data-bs-slide-to={idx}
                                className={idx === 0 ? "active" : ""}
                                style={{ backgroundColor: "var(--mk-blue)" }}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* No photos placeholder */}
                  {selectedEvent?.photos && selectedEvent.photos.length === 0 && (
                    <div
                      className="rounded-3 mb-4 d-flex align-items-center justify-content-center"
                      style={{
                        background: "var(--mk-blue-light, #DBEAFE)",
                        height: 140,
                        fontSize: "2.5rem",
                        color: "var(--mk-blue)",
                      }}
                    >
                      <span>📸 Photos coming soon</span>
                    </div>
                  )}

                  {/* Description */}
                  <p className="ev-modal-description">{selectedEvent?.description}</p>
                </>
              )}
            </div>

            <div className="modal-footer border-0 pt-0">
              <button
                type="button"
                className="btn btn-outline-secondary rounded-3 px-4"
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
