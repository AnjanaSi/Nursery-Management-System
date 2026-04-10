import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { getPublicGallery, getGalleryPhotoImageUrl } from "../services/api/gallerySectionService";
import logo from "../assets/logo.jpg";
import "./GalleryPage.css";

export default function GalleryPage() {
  const [galleryData, setGalleryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const lightboxModalRef = useRef(null);
  const lightboxModalInstance = useRef(null);

  useEffect(() => {
    getPublicGallery()
      .then((res) => setGalleryData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  // Init lightbox modal
  useEffect(() => {
    if (lightboxModalRef.current) {
      lightboxModalInstance.current = new window.bootstrap.Modal(lightboxModalRef.current, {
        backdrop: true,
        keyboard: true,
      });

      // Sync state when modal is hidden by user (backdrop click / Escape)
      const el = lightboxModalRef.current;
      const onHidden = () => setLightboxOpen(false);
      el.addEventListener("hidden.bs.modal", onHidden);
      return () => {
        el.removeEventListener("hidden.bs.modal", onHidden);
        lightboxModalInstance.current?.dispose();
      };
    }
  }, []);

  const photos = galleryData?.photos || [];

  const openLightbox = (idx) => {
    setLightboxIndex(idx);
    setLightboxOpen(true);
    lightboxModalInstance.current?.show();
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    lightboxModalInstance.current?.hide();
  };

  const goPrev = () => {
    setLightboxIndex((i) => Math.max(0, i - 1));
  };

  const goNext = () => {
    setLightboxIndex((i) => Math.min(photos.length - 1, i + 1));
  };

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e) => {
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxOpen, photos.length]);

  const config = galleryData?.config;

  return (
    <div className="gallery-page">
      {/* Branded navbar */}
      <nav className="gallery-navbar">
        <div className="container d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <img src={logo} alt="MerryKids logo" className="gallery-navbar-logo" />
            <span className="gallery-navbar-name">Merry Kids International Montessori</span>
          </div>
          <Link to="/" className="btn btn-outline-primary rounded-pill px-3 px-md-4">
            &larr; Back to Home
          </Link>
        </div>
      </nav>

      {/* Page title + subtitle */}
      <div className="gallery-page-header">
        <div className="container text-center">
          <h1 className="gallery-page-title mb-1">
            {config?.sectionTitle ?? "Gallery"}
          </h1>
          {config?.subtitle && (
            <p className="gallery-page-subtitle mb-0">{config.subtitle}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container py-5">
        {loading ? (
          <div className="row g-2 g-md-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="col-6 col-md-4 col-lg-3">
                <div className="gallery-skeleton" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="alert alert-danger rounded-3 text-center py-4">
            Unable to load gallery. Please try again later.
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-5">
            <div style={{ fontSize: "3rem" }}>📷</div>
            <h5 className="mt-3 text-muted">No photos yet</h5>
            <p className="text-muted">Check back soon — we&apos;ll be adding photos shortly.</p>
          </div>
        ) : (
          <div className="row g-2 g-md-3">
            {photos.map((photo, idx) => (
              <div key={photo.id} className="col-6 col-md-4 col-lg-3">
                <div
                  className="gallery-grid-item"
                  onClick={() => openLightbox(idx)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View photo ${idx + 1}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openLightbox(idx);
                  }}
                >
                  <img
                    src={getGalleryPhotoImageUrl(photo.id)}
                    alt={`Gallery photo ${idx + 1}`}
                    className="gallery-grid-img"
                    loading="lazy"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      <div
        className="modal fade"
        ref={lightboxModalRef}
        tabIndex={-1}
        aria-label="Photo lightbox"
      >
        <div className="modal-dialog modal-dialog-centered modal-lg modal-fullscreen-sm-down">
          <div className="modal-content border-0" style={{ background: "#111" }}>
            <div className="modal-header border-0 pb-0" style={{ background: "#111" }}>
              <span className="gallery-lightbox-counter text-white">
                {photos.length > 0 ? `${lightboxIndex + 1} / ${photos.length}` : ""}
              </span>
              <button
                type="button"
                className="btn-close btn-close-white ms-auto"
                onClick={closeLightbox}
                aria-label="Close"
              />
            </div>

            <div className="gallery-lightbox-body">
              {photos[lightboxIndex] && (
                <img
                  src={getGalleryPhotoImageUrl(photos[lightboxIndex].id)}
                  alt={`Gallery photo ${lightboxIndex + 1}`}
                  className="gallery-lightbox-img"
                />
              )}
            </div>

            <div
              className="modal-footer border-0 justify-content-center gap-3 py-3"
              style={{ background: "#111" }}
            >
              <button
                className="gallery-lightbox-nav"
                onClick={goPrev}
                disabled={lightboxIndex === 0}
                aria-label="Previous photo"
              >
                &#8249;
              </button>
              <button
                className="gallery-lightbox-nav"
                onClick={goNext}
                disabled={lightboxIndex === photos.length - 1}
                aria-label="Next photo"
              >
                &#8250;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
