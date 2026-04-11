import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.jpg";
import {
  getContactConfig,
  updateContactConfig,
  getContactItems,
  updateContactItem,
} from "../services/api/contactSectionService";
import "./AdminPages.css";

const ITEM_TYPE_ICON = {
  ADDRESS: "📍",
  PHONE: "📞",
  EMAIL: "✉️",
  OPENING_HOURS: "🕐",
};

export default function AdminContactSectionPage() {
  const navigate = useNavigate();

  // ── Config state ──────────────────────────────────────────────────────────
  const [configForm, setConfigForm] = useState({ sectionTitle: "", subtitle: "", mapEmbedUrl: "" });
  const [savedConfig, setSavedConfig] = useState({ sectionTitle: "", subtitle: "", mapEmbedUrl: "" });
  const [configEditing, setConfigEditing] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState("");
  const [configError, setConfigError] = useState("");

  // ── Map state ─────────────────────────────────────────────────────────────
  const [mapEditing, setMapEditing] = useState(false);
  const [mapForm, setMapForm] = useState("");
  const [mapSaving, setMapSaving] = useState(false);
  const [mapSuccess, setMapSuccess] = useState("");
  const [mapError, setMapError] = useState("");

  // ── Items state ───────────────────────────────────────────────────────────
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(true);
  const [itemsError, setItemsError] = useState("");
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemForm, setItemForm] = useState({ title: "", content: "" });
  const [itemSaving, setItemSaving] = useState(false);
  const [itemSuccess, setItemSuccess] = useState("");

  // ── Load config + items ───────────────────────────────────────────────────
  useEffect(() => {
    setConfigLoading(true);
    getContactConfig()
      .then((res) => {
        const loaded = {
          sectionTitle: res.data.sectionTitle || "",
          subtitle: res.data.subtitle || "",
          mapEmbedUrl: res.data.mapEmbedUrl || "",
        };
        setConfigForm(loaded);
        setSavedConfig(loaded);
        setMapForm(loaded.mapEmbedUrl);
      })
      .catch(() => setConfigError("Failed to load section config."))
      .finally(() => setConfigLoading(false));
  }, []);

  const fetchItems = () => {
    setItemsLoading(true);
    setItemsError("");
    getContactItems()
      .then((res) => setItems(res.data || []))
      .catch(() => setItemsError("Failed to load contact items."))
      .finally(() => setItemsLoading(false));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // ── Config handlers ───────────────────────────────────────────────────────
  const handleConfigChange = (e) => {
    setConfigForm({ ...configForm, [e.target.name]: e.target.value });
  };

  const handleConfigSave = async (e) => {
    e.preventDefault();
    if (!configForm.sectionTitle.trim() || !configForm.subtitle.trim()) {
      setConfigError("Both heading and subtitle are required.");
      return;
    }
    setConfigSaving(true);
    setConfigSuccess("");
    setConfigError("");
    try {
      await updateContactConfig({
        sectionTitle: configForm.sectionTitle.trim(),
        subtitle: configForm.subtitle.trim(),
        mapEmbedUrl: savedConfig.mapEmbedUrl, // preserve current map URL
      });
      const saved = {
        sectionTitle: configForm.sectionTitle.trim(),
        subtitle: configForm.subtitle.trim(),
        mapEmbedUrl: savedConfig.mapEmbedUrl,
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

  // ── Map handlers ──────────────────────────────────────────────────────────
  const handleMapSave = async (e) => {
    e.preventDefault();
    if (!mapForm.trim()) {
      setMapError("Map embed URL is required.");
      return;
    }
    if (!mapForm.trim().startsWith("https://")) {
      setMapError("Map embed URL must start with https://");
      return;
    }
    setMapSaving(true);
    setMapSuccess("");
    setMapError("");
    try {
      await updateContactConfig({
        sectionTitle: savedConfig.sectionTitle,
        subtitle: savedConfig.subtitle,
        mapEmbedUrl: mapForm.trim(),
      });
      const updated = { ...savedConfig, mapEmbedUrl: mapForm.trim() };
      setSavedConfig(updated);
      setConfigForm(updated);
      setMapEditing(false);
      setMapSuccess("Map URL updated successfully.");
      setTimeout(() => setMapSuccess(""), 3000);
    } catch (err) {
      setMapError(err.response?.data?.error || "Failed to update map URL.");
    } finally {
      setMapSaving(false);
    }
  };

  const handleMapCancel = () => {
    setMapForm(savedConfig.mapEmbedUrl);
    setMapEditing(false);
    setMapError("");
  };

  // ── Item handlers ─────────────────────────────────────────────────────────
  const openEditItem = (item) => {
    setEditingItemId(item.id);
    setItemForm({ title: item.title, content: item.content });
    setItemSuccess("");
  };

  const handleItemFormChange = (e) => {
    setItemForm({ ...itemForm, [e.target.name]: e.target.value });
  };

  const handleItemSave = async (e, itemId) => {
    e.preventDefault();
    if (!itemForm.title.trim() || !itemForm.content.trim()) {
      return;
    }
    setItemSaving(true);
    try {
      await updateContactItem(itemId, {
        title: itemForm.title.trim(),
        content: itemForm.content.trim(),
      });
      setEditingItemId(null);
      setItemSuccess("Item updated successfully.");
      setTimeout(() => setItemSuccess(""), 3000);
      fetchItems();
    } catch (err) {
      setItemsError(err.response?.data?.error || "Failed to update item.");
    } finally {
      setItemSaving(false);
    }
  };

  const handleItemCancel = () => {
    setEditingItemId(null);
    setItemsError("");
  };

  return (
    <div>
      <div className="admin-mgmt-header d-flex align-items-center gap-3">
        <img src={logo} alt="MerryKids" className="admin-mgmt-header-logo" />
        <div>
          <h5 className="fw-bold mb-0" style={{ color: "var(--mk-blue)" }}>
            Contact Section Management
          </h5>
          <small className="text-muted">Edit heading, contact details, and map embed</small>
        </div>
      </div>

      {/* ── Section Config Panel ─────────────────────────────────────────── */}
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
                <div className="fw-semibold">
                  {savedConfig.sectionTitle || <span className="text-muted fst-italic">Not set</span>}
                </div>
              </div>
              <div className="col-12">
                <div className="small text-muted fw-semibold mb-1">Subtitle / Description</div>
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {savedConfig.subtitle || <span className="text-muted fst-italic">Not set</span>}
                </div>
              </div>
            </div>
          </div>
        ) : (
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
                placeholder="e.g. Get in Touch"
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

      {/* ── Contact Items Panel ──────────────────────────────────────────── */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="fw-bold mb-0" style={{ color: "var(--mk-blue)" }}>
            Contact Details
          </h6>
          <small className="text-muted">4 fixed items</small>
        </div>

        {itemSuccess && (
          <div className="alert alert-success py-2 small mb-3">{itemSuccess}</div>
        )}
        {itemsError && (
          <div className="alert alert-danger py-2 small mb-3">
            {itemsError}
            <button type="button" className="btn-close btn-close-sm float-end" onClick={() => setItemsError("")} />
          </div>
        )}

        {itemsLoading ? (
          <div className="text-center py-4">
            <span className="spinner-border text-primary" />
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {items.map((item) => (
              <div key={item.id} className="border rounded-3 p-3">
                {editingItemId === item.id ? (
                  <form onSubmit={(e) => handleItemSave(e, item.id)}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <span style={{ fontSize: "1.3rem" }}>{ITEM_TYPE_ICON[item.itemType] || "📌"}</span>
                      <span
                        className="badge rounded-pill"
                        style={{ background: "var(--mk-blue)", color: "#fff", fontSize: "0.7rem" }}
                      >
                        {item.itemType}
                      </span>
                    </div>
                    <div className="mb-2">
                      <label className="form-label fw-semibold small">Label / Title</label>
                      <input
                        type="text"
                        className="form-control form-control-sm rounded-3"
                        name="title"
                        value={itemForm.title}
                        onChange={handleItemFormChange}
                        maxLength={80}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold small">Content</label>
                      <textarea
                        className="form-control form-control-sm rounded-3"
                        name="content"
                        value={itemForm.content}
                        onChange={handleItemFormChange}
                        rows={3}
                        maxLength={1000}
                        required
                      />
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        type="submit"
                        className="btn btn-sm btn-primary rounded-3"
                        disabled={itemSaving}
                      >
                        {itemSaving && <span className="spinner-border spinner-border-sm me-2" />}
                        Save
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary rounded-3"
                        onClick={handleItemCancel}
                        disabled={itemSaving}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    <div className="d-flex align-items-start gap-2 flex-grow-1">
                      <span style={{ fontSize: "1.3rem", lineHeight: 1 }}>{ITEM_TYPE_ICON[item.itemType] || "📌"}</span>
                      <div>
                        <div className="fw-semibold small">{item.title}</div>
                        <div className="text-muted small mt-1" style={{ whiteSpace: "pre-wrap" }}>
                          {item.content}
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-outline-primary rounded-3 flex-shrink-0"
                      onClick={() => openEditItem(item)}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Map Embed Panel ──────────────────────────────────────────────── */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="fw-bold mb-0" style={{ color: "var(--mk-blue)" }}>
            Map Embed URL
          </h6>
          {!configLoading && !mapEditing && (
            <button
              className="btn btn-sm btn-outline-primary rounded-3"
              onClick={() => {
                setMapSuccess("");
                setMapError("");
                setMapEditing(true);
              }}
            >
              Edit URL
            </button>
          )}
        </div>

        {configLoading ? (
          <div className="text-center py-3">
            <span className="spinner-border spinner-border-sm text-primary" />
          </div>
        ) : mapEditing ? (
          <form onSubmit={handleMapSave}>
            {mapError && (
              <div className="alert alert-danger py-2 small mb-3">
                {mapError}
                <button type="button" className="btn-close btn-close-sm float-end" onClick={() => setMapError("")} />
              </div>
            )}
            <div className="mb-3">
              <label className="form-label fw-semibold small">
                Google Maps Embed URL <span className="text-muted fw-normal">(iframe src)</span>
              </label>
              <input
                type="url"
                className="form-control rounded-3"
                value={mapForm}
                onChange={(e) => setMapForm(e.target.value)}
                placeholder="https://www.google.com/maps?q=..."
                required
              />
              <div className="form-text">Must start with https://. Paste the full embed URL from Google Maps.</div>
            </div>
            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary rounded-3 admin-action-btn"
                disabled={mapSaving}
              >
                {mapSaving && <span className="spinner-border spinner-border-sm me-2" />}
                Save URL
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary rounded-3 admin-action-btn"
                onClick={handleMapCancel}
                disabled={mapSaving}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div>
            {mapSuccess && (
              <div className="alert alert-success py-2 small mb-3">{mapSuccess}</div>
            )}
            <div className="mb-3">
              <div className="small text-muted fw-semibold mb-1">Current URL</div>
              <div
                className="small text-break"
                style={{ fontFamily: "monospace", background: "var(--mk-surface-alt, #f3f4f6)", padding: "6px 10px", borderRadius: 6 }}
              >
                {savedConfig.mapEmbedUrl || <span className="text-muted fst-italic">Not set</span>}
              </div>
            </div>
            {savedConfig.mapEmbedUrl && (
              <div className="ratio ratio-21x9 rounded-3 overflow-hidden border">
                <iframe
                  src={savedConfig.mapEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Map Preview"
                  style={{ border: 0 }}
                  allowFullScreen
                />
              </div>
            )}
          </div>
        )}
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
