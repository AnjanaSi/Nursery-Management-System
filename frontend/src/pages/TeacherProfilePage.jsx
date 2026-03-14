import { useState, useEffect } from "react";
import { getProfile } from "../services/api/teacherService";
import "./TeacherProfilePage.css";

const DESIGNATION_LABELS = {
  ASSISTANT_TEACHER: "Assistant Teacher",
  TEACHER: "Teacher",
  SENIOR_TEACHER: "Senior Teacher",
  PRINCIPAL: "Principal",
};

const EMPLOYMENT_STATUS_LABELS = {
  ACTIVE: "Active",
  RESIGNED: "Resigned",
  RETIRED: "Retired",
  TERMINATED: "Terminated",
};

const LEVEL_LABELS = {
  LKG1: "LKG 1",
  UKG1: "UKG 1",
  UKG2: "UKG 2",
};

export default function TeacherProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getProfile()
      .then((res) => setProfile(res.data.data))
      .catch((err) => setError(err.response?.data?.error || "Failed to load profile."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="tp-page">
        <div className="tc-spinner-wrap">
          <span className="spinner-border text-primary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tp-page">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  return (
    <div className="tp-page">
      <div className="tp-page-header">
        <h2 className="tc-page-title">My Profile</h2>
        <p className="tc-page-subtitle">Your account and assignment details</p>
      </div>

      <div className="tp-card">
        <div className="tp-avatar">
          <span className="tp-avatar-icon">👤</span>
        </div>

        <h4 className="tp-name">{profile.fullName}</h4>
        <div className="tp-designation">
          {DESIGNATION_LABELS[profile.designation] || profile.designation}
        </div>

        <div className="tp-level-badge">
          Level: {LEVEL_LABELS[profile.levelAssigned] || profile.levelAssigned}
        </div>

        <div className="tp-fields">
          <ProfileField label="Email" value={profile.email} />
          <ProfileField label="Employment ID" value={profile.employmentId} />
          <ProfileField
            label="Designation"
            value={DESIGNATION_LABELS[profile.designation] || profile.designation}
          />
          <ProfileField
            label="Assigned Level"
            value={LEVEL_LABELS[profile.levelAssigned] || profile.levelAssigned}
          />
          <ProfileField
            label="Employment Status"
            value={
              <span
                className={`badge ${
                  profile.employmentStatus === "ACTIVE"
                    ? "bg-success"
                    : "bg-secondary"
                }`}
              >
                {EMPLOYMENT_STATUS_LABELS[profile.employmentStatus] || profile.employmentStatus}
              </span>
            }
          />
        </div>

        <p className="tp-readonly-note">
          To update your profile details, please contact the administrator.
        </p>
      </div>
    </div>
  );
}

function ProfileField({ label, value }) {
  return (
    <div className="tp-field">
      <span className="tp-field-label">{label}</span>
      <span className="tp-field-value">{value}</span>
    </div>
  );
}
