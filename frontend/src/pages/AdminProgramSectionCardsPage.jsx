import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpg";
import {
  getProgramConfig,
  updateProgramConfig,
  getAdminProgramCards,
  deleteProgramCard,
  moveProgramCardUp,
  moveProgramCardDown,
  getProgramCardImageUrl,
} from "../services/api/programSectionService";
import "./AdminPages.css";

export default function AdminProgramSectionCardsPage() {
  const navigate = useNavigate();

  // Config state
  const [configForm, setConfigForm] = useState({ sectionTitle: "", subtitle: "" });
  const [savedConfig, setSavedConfig] = useState({ sectionTitle: "", subtitle: "" });
  const [configEditing, setConfigEditing] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState("");
  const [configError, setConfigError] = useState("");

  // Cards state
  const [cards, setCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [cardsError, setCardsError] = useState("");
  const [movingId, setMovingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const deleteModalRef = useRef(null);
  const deleteModalInstance = useRef(null);

  // Init modal
  useEffect(() => {
    if (deleteModalRef.current) {
      deleteModalInstance.current = new window.bootstrap.Modal(deleteModalRef.current);
    }
    return () => {
      deleteModalInstance.current?.dispose();
    };
  }, []);

  // Load config
  useEffect(() => {
    setConfigLoading(true);
    getProgramConfig()
      .then((res) => {
        const loaded = {
          sectionTitle: res.data.sectionTitle || "",
          subtitle: res.data.subtitle || "",
        };
        setConfigForm(loaded);
        setSavedConfig(loaded);
      })
      .catch(() => setConfigError("Failed to load section config."))
      .finally(() => setConfigLoading(false));
  }, []);

  // Load cards
  const fetchCards = () => {
    setCardsLoading(true);
    setCardsError("");
    getAdminProgramCards()
      .then((res) => setCards(res.data || []))
      .catch(() => setCardsError("Failed to load cards."))
      .finally(() => setCardsLoading(false));
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleConfigChange = (e) => {
    setConfigForm({ ...configForm, [e.target.name]: e.target.value });
  };

  const handleConfigSave = async (e) => {
    e.preventDefault();
    if (!configForm.sectionTitle.trim() || !configForm.subtitle.trim()) {
      setConfigError("Both fields are required.");
      return;
    }
    setConfigSaving(true);
    setConfigSuccess("");
    setConfigError("");
    try {
      await updateProgramConfig({
        sectionTitle: configForm.sectionTitle.trim(),
        subtitle: configForm.subtitle.trim(),
      });
      const saved = {
        sectionTitle: configForm.sectionTitle.trim(),
        subtitle: configForm.subtitle.trim(),
      };
      setSavedConfig(saved);
      setConfigEditing(false);
      setConfigSuccess("Section config saved successfully.");
      setTimeout(() => setConfigSuccess(""), 3000);
    } catch (err) {
      setConfigError(err.response?.data?.error || "Failed to save config.");
    } finally {
      setConfigSaving(false);
    }
  };

  const handleConfigCancel = () => {
    setConfigForm(savedConfig);
    setConfigEditing(false);
    setConfigError("");
  };

  const handleMoveUp = async (id) => {
    setMovingId(id);
    try {
      await moveProgramCardUp(id);
      fetchCards();
    } catch {
      setCardsError("Failed to move card.");
    } finally {
      setMovingId(null);
    }
  };

  const handleMoveDown = async (id) => {
    setMovingId(id);
    try {
      await moveProgramCardDown(id);
      fetchCards();
    } catch {
      setCardsError("Failed to move card.");
    } finally {
      setMovingId(null);
    }
  };

  const openDeleteModal = (id) => {
    setDeleteId(id);
    deleteModalInstance.current?.show();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteProgramCard(deleteId);
      deleteModalInstance.current?.hide();
      setDeleteId(null);
      fetchCards();
    } catch (err) {
      setCardsError(err.response?.data?.error || "Failed to delete card.");
      deleteModalInstance.current?.hide();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="admin-mgmt-header d-flex align-items-center gap-3">
        <img src={logo} alt="MerryKids" className="admin-mgmt-header-logo" />
        <div>
          <h5 className="fw-bold mb-0" style={{ color: "var(--mk-blue)" }}>
            Programs Section Cards
          </h5>
          <small className="text-muted">Edit section config and manage card order</small>
        </div>
      </div>

      {/* Section Config */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="fw-bold mb-0" style={{ color: "var(--mk-blue)" }}>
            Section Content
          </h6>
          {!configLoading && !configEditing && (
            <button
              className="btn btn-sm btn-outline-primary rounded-3"
              onClick={() => {
                setConfigSuccess("");
                setConfigError("");
                setConfigEditing(true);
              }}
            >
              Edit Details
            </button>
          )}
        </div>

        {configLoading ? (
          <div className="text-center py-3">
            <span className="spinner-border spinner-border-sm text-primary" />
          </div>
        ) : !configEditing ? (
          /* Read-only view */
          <div className="admin-detail-section">
            {configSuccess && (
              <div className="alert alert-success py-2 small mb-3">{configSuccess}</div>
            )}
            {configError && (
              <div className="alert alert-danger py-2 small mb-3">
                {configError}
                <button type="button" className="btn-close btn-close-sm float-end" onClick={() => setConfigError("")} />
              </div>
            )}
            <div className="row g-3">
              <div className="col-12">
                <div className="small text-muted fw-semibold mb-1">Section Heading</div>
                <div className="fw-semibold">{savedConfig.sectionTitle || <span className="text-muted fst-italic">Not set</span>}</div>
              </div>
              <div className="col-12">
                <div className="small text-muted fw-semibold mb-1">Subtitle / Description</div>
                <div style={{ whiteSpace: "pre-wrap" }}>{savedConfig.subtitle || <span className="text-muted fst-italic">Not set</span>}</div>
              </div>
            </div>
          </div>
        ) : (
          /* Edit form */
          <form onSubmit={handleConfigSave}>
            {configError && (
              <div className="alert alert-danger py-2 small mb-3">
                {configError}
                <button type="button" className="btn-close btn-close-sm float-end" onClick={() => setConfigError("")} />
              </div>
            )}
            <div className="mb-3">
              <label className="form-label fw-semibold small">Section Heading</label>
              <input
                type="text"
                className="form-control rounded-3"
                name="sectionTitle"
                value={configForm.sectionTitle}
                onChange={handleConfigChange}
                maxLength={120}
                placeholder="e.g. Our Programs"
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label fw-semibold small">Subtitle / Description</label>
              <textarea
                className="form-control rounded-3"
                name="subtitle"
                value={configForm.subtitle}
                onChange={handleConfigChange}
                rows={3}
                maxLength={1000}
                placeholder="A short description shown below the heading..."
                required
              />
            </div>
            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary rounded-3 admin-action-btn"
                disabled={configSaving}
              >
                {configSaving && <span className="spinner-border spinner-border-sm me-2" />}
                Save Config
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary rounded-3 admin-action-btn"
                onClick={handleConfigCancel}
                disabled={configSaving}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Cards List */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="fw-bold mb-0" style={{ color: "var(--mk-blue)" }}>
            Program Cards
          </h6>
          <button
            className="btn btn-sm rounded-3"
            style={{ background: "var(--mk-pink)", color: "#fff", border: "none" }}
            onClick={() => navigate("/admin/programs/cards/new")}
          >
            + Add Card
          </button>
        </div>

        {cardsError && (
          <div className="alert alert-danger py-2 small">
            {cardsError}
            <button type="button" className="btn-close btn-close-sm float-end" onClick={() => setCardsError("")} />
          </div>
        )}

        {cardsLoading ? (
          <div className="text-center py-4">
            <span className="spinner-border text-primary" />
          </div>
        ) : cards.length === 0 ? (
          <div className="admin-empty-state py-4">
            <div className="admin-empty-state-icon">🎓</div>
            <h5>No Program Cards Yet</h5>
            <p>Add your first program card using the button above.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover admin-table align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: 64 }}>Image</th>
                  <th>Title</th>
                  <th className="d-none d-md-table-cell">Age Range</th>
                  <th className="d-none d-md-table-cell" style={{ width: 80 }}>Order</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card, idx) => (
                  <tr key={card.id}>
                    <td>
                      {card.hasImage ? (
                        <img
                          src={getProgramCardImageUrl(card.id)}
                          alt={card.title}
                          style={{
                            width: 56,
                            height: 40,
                            objectFit: "cover",
                            borderRadius: 6,
                            border: "1px solid var(--mk-border)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 56,
                            height: 40,
                            borderRadius: 6,
                            background: "var(--mk-surface-alt)",
                            border: "1px solid var(--mk-border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.75rem",
                            color: "var(--mk-text-muted)",
                          }}
                        >
                          No img
                        </div>
                      )}
                    </td>
                    <td className="fw-semibold">{card.title}</td>
                    <td className="d-none d-md-table-cell text-muted small">{card.ageRange}</td>
                    <td className="d-none d-md-table-cell text-muted small">{card.displayOrder}</td>
                    <td>
                      <div className="d-flex gap-1 flex-wrap">
                        <button
                          className="btn btn-sm btn-outline-secondary rounded-3"
                          onClick={() => handleMoveUp(card.id)}
                          disabled={idx === 0 || movingId === card.id}
                          title="Move Up"
                        >
                          {movingId === card.id ? (
                            <span className="spinner-border spinner-border-sm" />
                          ) : (
                            "▲"
                          )}
                        </button>
                        <button
                          className="btn btn-sm btn-outline-secondary rounded-3"
                          onClick={() => handleMoveDown(card.id)}
                          disabled={idx === cards.length - 1 || movingId === card.id}
                          title="Move Down"
                        >
                          {movingId === card.id ? (
                            <span className="spinner-border spinner-border-sm" />
                          ) : (
                            "▼"
                          )}
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary rounded-3"
                          onClick={() => navigate(`/admin/programs/cards/${card.id}/edit`)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger rounded-3"
                          onClick={() => openDeleteModal(card.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <button
        className="btn btn-outline-secondary rounded-3"
        onClick={() => navigate("/admin/programs")}
      >
        &larr; Back to Programs Section
      </button>

      {/* Delete Confirmation Modal */}
      <div className="modal fade" ref={deleteModalRef} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4">
            <div className="modal-header border-0">
              <h5 className="modal-title fw-bold" style={{ color: "var(--mk-blue)" }}>
                Confirm Delete
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <p className="admin-confirm-text">
                Are you sure you want to delete this program card? It will be hidden from the public
                site immediately. This action uses soft-delete.
              </p>
            </div>
            <div className="modal-footer border-0">
              <button
                type="button"
                className="btn btn-outline-secondary rounded-3"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger rounded-3"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting && <span className="spinner-border spinner-border-sm me-2" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
