import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { bulkPromote, bulkExit } from "../services/api/studentsApi";
import "./StudentPages.css";

export default function YearTransitionPage() {
  const navigate = useNavigate();

  // Promote state
  const [promotePreview, setPromotePreview] = useState(null);
  const [promoteLoading, setPromoteLoading] = useState(false);
  const [promoteResult, setPromoteResult] = useState(null);
  const [promoteError, setPromoteError] = useState("");
  const [promoteSelectedIds, setPromoteSelectedIds] = useState([]);

  // Exit state
  const [exitLevel, setExitLevel] = useState("UKG2");
  const [exitPreview, setExitPreview] = useState(null);
  const [exitLoading, setExitLoading] = useState(false);
  const [exitResult, setExitResult] = useState(null);
  const [exitError, setExitError] = useState("");
  const [exitLeaveDate, setExitLeaveDate] = useState("");
  const [exitSelectedIds, setExitSelectedIds] = useState([]);

  // Promote handlers
  const handlePromotePreview = async () => {
    setPromoteLoading(true);
    setPromoteError("");
    setPromoteResult(null);
    try {
      const res = await bulkPromote({ preview: true });
      setPromotePreview(res.data);
      setPromoteSelectedIds((res.data.students || []).map((s) => s.id));
    } catch {
      setPromoteError("Failed to load promotion preview.");
    } finally {
      setPromoteLoading(false);
    }
  };

  const handlePromoteExecute = async () => {
    if (promoteSelectedIds.length === 0) return;
    const ok = window.confirm(
      `Are you sure you want to promote ${promoteSelectedIds.length} student(s) from LKG1 to UKG2?`
    );
    if (!ok) return;

    setPromoteLoading(true);
    setPromoteError("");
    try {
      const res = await bulkPromote({ preview: false, studentIds: promoteSelectedIds });
      setPromoteResult(res.data);
      setPromotePreview(null);
    } catch (err) {
      setPromoteError(err.response?.data?.error || "Failed to execute promotion.");
    } finally {
      setPromoteLoading(false);
    }
  };

  const togglePromoteStudent = (studentId) => {
    setPromoteSelectedIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleAllPromote = () => {
    const all = (promotePreview?.students || []).map((s) => s.id);
    if (promoteSelectedIds.length === all.length) {
      setPromoteSelectedIds([]);
    } else {
      setPromoteSelectedIds(all);
    }
  };

  // Exit handlers
  const handleExitPreview = async () => {
    setExitLoading(true);
    setExitError("");
    setExitResult(null);
    try {
      const res = await bulkExit({ preview: true, level: exitLevel });
      setExitPreview(res.data);
      setExitSelectedIds((res.data.students || []).map((s) => s.id));
    } catch {
      setExitError("Failed to load exit preview.");
    } finally {
      setExitLoading(false);
    }
  };

  const handleExitExecute = async () => {
    if (exitSelectedIds.length === 0 || !exitLeaveDate) return;
    const ok = window.confirm(
      `Are you sure you want to graduate ${exitSelectedIds.length} student(s)? Their guardian accounts may be disabled.`
    );
    if (!ok) return;

    setExitLoading(true);
    setExitError("");
    try {
      const res = await bulkExit({
        preview: false,
        studentIds: exitSelectedIds,
        leaveDate: exitLeaveDate,
      });
      setExitResult(res.data);
      setExitPreview(null);
    } catch (err) {
      setExitError(err.response?.data?.error || "Failed to execute year-end exit.");
    } finally {
      setExitLoading(false);
    }
  };

  const toggleExitStudent = (studentId) => {
    setExitSelectedIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleAllExit = () => {
    const all = (exitPreview?.students || []).map((s) => s.id);
    if (exitSelectedIds.length === all.length) {
      setExitSelectedIds([]);
    } else {
      setExitSelectedIds(all);
    }
  };

  const renderStudentTable = (students, selectedIds, toggleFn, toggleAllFn) => (
    <div className="table-responsive mt-3">
      <table className="table table-hover student-table">
        <thead>
          <tr>
            <th style={{ width: "40px" }}>
              <input
                type="checkbox"
                className="form-check-input"
                checked={selectedIds.length === students.length && students.length > 0}
                onChange={toggleAllFn}
              />
            </th>
            <th>Adm. No</th>
            <th>Full Name</th>
            <th>Level</th>
            <th>Batch</th>
            <th>Guardian(s)</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => (
            <tr key={s.id}>
              <td>
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={selectedIds.includes(s.id)}
                  onChange={() => toggleFn(s.id)}
                />
              </td>
              <td style={{ fontSize: "0.85rem" }}>{s.admissionNo}</td>
              <td>{s.fullName}</td>
              <td>{s.currentLevel}</td>
              <td style={{ fontSize: "0.85rem" }}>{s.batchCode}</td>
              <td style={{ fontSize: "0.85rem" }}>{s.guardianNames || "\u2014"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold mb-1" style={{ color: "var(--mk-blue)" }}>
          Year Transition
        </h4>
        <p className="text-muted mb-0">Promote students or process year-end exits</p>
      </div>

      {/* Promote Section */}
      <div className="transition-card">
        <h5 className="fw-bold mb-2" style={{ color: "var(--mk-blue)" }}>
          Promote LKG1 &rarr; UKG2
        </h5>
        <p className="text-muted small mb-3">
          Promote all active LKG1 students to UKG2 level.
        </p>

        {promoteError && (
          <div className="alert alert-danger py-2">
            {promoteError}
            <button
              type="button"
              className="btn-close float-end"
              style={{ fontSize: "0.7rem" }}
              onClick={() => setPromoteError("")}
            />
          </div>
        )}

        {promoteResult && (
          <div className="alert alert-success py-2">
            {promoteResult.message || `${promoteResult.processedCount} student(s) promoted successfully.`}
          </div>
        )}

        {!promotePreview && !promoteResult && (
          <button
            className="btn btn-primary btn-sm rounded-3"
            onClick={handlePromotePreview}
            disabled={promoteLoading}
          >
            {promoteLoading && <span className="spinner-border spinner-border-sm me-2" />}
            Preview Eligible Students
          </button>
        )}

        {promotePreview && (
          <>
            <div className="mb-2">
              <strong>{promotePreview.eligibleCount}</strong> eligible student(s) found.
              <strong className="ms-2">{promoteSelectedIds.length}</strong> selected.
            </div>
            {promotePreview.students?.length > 0 ? (
              <>
                {renderStudentTable(
                  promotePreview.students,
                  promoteSelectedIds,
                  togglePromoteStudent,
                  toggleAllPromote
                )}
                <div className="d-flex gap-2 mt-2">
                  <button
                    className="btn btn-success btn-sm rounded-3"
                    onClick={handlePromoteExecute}
                    disabled={promoteLoading || promoteSelectedIds.length === 0}
                  >
                    {promoteLoading && <span className="spinner-border spinner-border-sm me-2" />}
                    Confirm Promotion ({promoteSelectedIds.length})
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm rounded-3"
                    onClick={() => setPromotePreview(null)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <p className="text-muted">No eligible students found for promotion.</p>
            )}
          </>
        )}

        {promoteResult && (
          <button
            className="btn btn-outline-secondary btn-sm rounded-3 mt-2"
            onClick={() => setPromoteResult(null)}
          >
            Done
          </button>
        )}
      </div>

      {/* Exit Section */}
      <div className="transition-card">
        <h5 className="fw-bold mb-2" style={{ color: "var(--mk-blue)" }}>
          Year-End Exit (Graduation)
        </h5>
        <p className="text-muted small mb-3">
          Mark students as graduated at year-end. Their guardian portal accounts will be
          disabled if they have no other active students.
        </p>

        {exitError && (
          <div className="alert alert-danger py-2">
            {exitError}
            <button
              type="button"
              className="btn-close float-end"
              style={{ fontSize: "0.7rem" }}
              onClick={() => setExitError("")}
            />
          </div>
        )}

        {exitResult && (
          <div className="alert alert-success py-2">
            {exitResult.message || `${exitResult.processedCount} student(s) graduated successfully.`}
          </div>
        )}

        {!exitPreview && !exitResult && (
          <div className="d-flex align-items-end gap-2">
            <div>
              <label className="form-label small fw-semibold">Level</label>
              <select
                className="form-select form-select-sm rounded-3"
                value={exitLevel}
                onChange={(e) => setExitLevel(e.target.value)}
                style={{ width: "120px" }}
              >
                <option value="UKG1">UKG1</option>
                <option value="UKG2">UKG2</option>
              </select>
            </div>
            <button
              className="btn btn-primary btn-sm rounded-3"
              onClick={handleExitPreview}
              disabled={exitLoading}
            >
              {exitLoading && <span className="spinner-border spinner-border-sm me-2" />}
              Preview Eligible Students
            </button>
          </div>
        )}

        {exitPreview && (
          <>
            <div className="mb-2">
              <strong>{exitPreview.eligibleCount}</strong> eligible student(s) in {exitLevel}.
              <strong className="ms-2">{exitSelectedIds.length}</strong> selected.
            </div>
            {exitPreview.students?.length > 0 ? (
              <>
                {renderStudentTable(
                  exitPreview.students,
                  exitSelectedIds,
                  toggleExitStudent,
                  toggleAllExit
                )}
                <div className="d-flex align-items-end gap-2 mt-2">
                  <div>
                    <label className="form-label small fw-semibold">Leave Date *</label>
                    <input
                      type="date"
                      className="form-control form-control-sm rounded-3"
                      value={exitLeaveDate}
                      onChange={(e) => setExitLeaveDate(e.target.value)}
                      style={{ width: "160px" }}
                    />
                  </div>
                  <button
                    className="btn btn-success btn-sm rounded-3"
                    onClick={handleExitExecute}
                    disabled={exitLoading || exitSelectedIds.length === 0 || !exitLeaveDate}
                  >
                    {exitLoading && <span className="spinner-border spinner-border-sm me-2" />}
                    Confirm Exit ({exitSelectedIds.length})
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm rounded-3"
                    onClick={() => setExitPreview(null)}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <p className="text-muted">No eligible students found for exit in {exitLevel}.</p>
            )}
          </>
        )}

        {exitResult && (
          <button
            className="btn btn-outline-secondary btn-sm rounded-3 mt-2"
            onClick={() => setExitResult(null)}
          >
            Done
          </button>
        )}
      </div>

      {/* Back Button */}
      <div className="mt-3">
        <button
          className="btn btn-outline-secondary rounded-3"
          onClick={() => navigate("/admin/students")}
        >
          &larr; Back to Student Management
        </button>
      </div>
    </div>
  );
}
