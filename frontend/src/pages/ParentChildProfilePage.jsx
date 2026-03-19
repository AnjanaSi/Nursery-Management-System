import { useState, useEffect } from "react";
import {
  getChildren,
  getChildProfile,
  formatDate,
} from "../services/api/parentService";
import "./ParentAnnouncementsPage.css";

function InitialsAvatar({ name }) {
  const initials = name
    ? name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "?";
  return (
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: "50%",
        background: "var(--mk-blue-light)",
        color: "var(--mk-blue)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.6rem",
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

export default function ParentChildProfilePage() {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [profile, setProfile] = useState(null);
  const [childrenLoading, setChildrenLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setChildrenLoading(true);
    getChildren()
      .then((res) => {
        const list = res.data.data || [];
        setChildren(list);
        if (list.length > 0) setSelectedChild(list[0]);
      })
      .catch(() => setError("Failed to load your children's information."))
      .finally(() => setChildrenLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    setProfileLoading(true);
    setProfile(null);
    setError("");
    getChildProfile(selectedChild.id)
      .then((res) => setProfile(res.data.data))
      .catch(() => setError("Failed to load child profile."))
      .finally(() => setProfileLoading(false));
  }, [selectedChild]);

  const handleChildChange = (e) => {
    const child = children.find((c) => String(c.id) === e.target.value);
    if (child) setSelectedChild(child);
  };

  const statusBadge = (status) => {
    const map = {
      ACTIVE: "success",
      WITHDRAWN: "secondary",
      GRADUATED: "primary",
    };
    return (
      <span className={`badge bg-${map[status] || "secondary"}`}>
        {status}
      </span>
    );
  };

  if (childrenLoading) {
    return (
      <div className="pp-page">
        <div className="pp-spinner-wrap">
          <span className="spinner-border text-primary" />
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="pp-page">
        <div className="pp-empty-state">
          <div className="pp-empty-icon">👨‍👩‍👧</div>
          <h5>No active children found</h5>
          <p className="text-muted">
            Your account is not linked to any active students. Please contact the school office.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pp-page">
      <div className="pp-page-header">
        <div>
          <h2 className="pp-page-title">My Child</h2>
          <p className="pp-page-subtitle">Profile information for your child at MerryKids</p>
        </div>
      </div>

      {children.length >= 2 && (
        <div className="pp-child-selector mb-4">
          <label className="fw-semibold small me-2" htmlFor="profile-child-select">
            Viewing:
          </label>
          <select
            id="profile-child-select"
            className="form-select form-select-sm"
            style={{ maxWidth: 280 }}
            value={selectedChild?.id || ""}
            onChange={handleChildChange}
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName} — {c.currentLevel}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="alert alert-danger alert-dismissible">
          {error}
          <button type="button" className="btn-close" onClick={() => setError("")} />
        </div>
      )}

      {profileLoading ? (
        <div className="pp-spinner-wrap">
          <span className="spinner-border text-primary" />
        </div>
      ) : profile ? (
        <div
          className="bg-white rounded border"
          style={{ borderColor: "var(--mk-border)", overflow: "hidden" }}
        >
          {/* Profile header */}
          <div
            className="d-flex align-items-center gap-3 p-3 p-md-4"
            style={{ borderBottom: "1px solid var(--mk-border)" }}
          >
            <InitialsAvatar name={profile.fullName} />
            <div>
              <h4 className="fw-bold mb-1" style={{ color: "var(--mk-text)" }}>
                {profile.fullName}
              </h4>
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <span
                  className="badge"
                  style={{
                    background: "var(--mk-blue-light)",
                    color: "var(--mk-blue)",
                    fontWeight: 600,
                  }}
                >
                  {profile.currentLevel}
                </span>
                {statusBadge(profile.status)}
                <span className="text-muted small">{profile.admissionNo}</span>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="p-3 p-md-4">
            <div className="row g-3">
              <div className="col-sm-6">
                <div className="small text-muted mb-1">Date of Birth</div>
                <div className="fw-semibold">{formatDate(profile.dateOfBirth)}</div>
              </div>
              <div className="col-sm-6">
                <div className="small text-muted mb-1">Gender</div>
                <div className="fw-semibold">{profile.gender}</div>
              </div>
              <div className="col-sm-6">
                <div className="small text-muted mb-1">Current Level</div>
                <div className="fw-semibold">{profile.currentLevel}</div>
              </div>
              <div className="col-sm-6">
                <div className="small text-muted mb-1">Entry Level</div>
                <div className="fw-semibold">{profile.entryLevel}</div>
              </div>
              <div className="col-sm-6">
                <div className="small text-muted mb-1">Entry Year</div>
                <div className="fw-semibold">{profile.entryYear}</div>
              </div>
              <div className="col-sm-6">
                <div className="small text-muted mb-1">Batch</div>
                <div className="fw-semibold">{profile.batchCode}</div>
              </div>
              <div className="col-sm-6">
                <div className="small text-muted mb-1">Enrollment Date</div>
                <div className="fw-semibold">{formatDate(profile.enrollmentDate)}</div>
              </div>
              <div className="col-sm-6">
                <div className="small text-muted mb-1">Your Relationship</div>
                <div className="fw-semibold">{profile.relationshipType}</div>
              </div>
            </div>

            {/* Other guardians */}
            {profile.otherGuardians && profile.otherGuardians.length > 0 && (
              <div className="mt-4">
                <h6
                  className="fw-semibold mb-3"
                  style={{ color: "var(--mk-text)", borderBottom: "1px solid var(--mk-border)", paddingBottom: "0.5rem" }}
                >
                  Other Guardians
                </h6>
                <div className="table-responsive">
                  <table className="table table-sm table-borderless mb-0">
                    <thead>
                      <tr className="text-muted small">
                        <th>Name</th>
                        <th>Relationship</th>
                        <th>Phone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.otherGuardians.map((g, i) => (
                        <tr key={i}>
                          <td className="fw-semibold">{g.fullName}</td>
                          <td>{g.relationshipType}</td>
                          <td className="text-muted">{g.phone || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
