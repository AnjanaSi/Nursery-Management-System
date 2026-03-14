import axiosClient from "./axiosClient";

const BASE = "/api/v1/teacher";

// ─── Profile ───────────────────────────────────────────────────────────────

export const getProfile = () => axiosClient.get(`${BASE}/profile`);

// ─── Content list ──────────────────────────────────────────────────────────

/**
 * @param {"announcements"|"homework"} type
 * @param {{ archived?: boolean, page?: number, size?: number }} opts
 */
export const listContent = (type, { archived = false, page = 0, size = 10 } = {}) =>
  axiosClient.get(`${BASE}/${type}`, { params: { archived, page, size } });

// ─── Content CRUD ──────────────────────────────────────────────────────────

/**
 * @param {"announcements"|"homework"} type
 * @param {object} data  JSON payload
 * @param {File[]} files Optional attachment files
 */
export const createContent = (type, data, files = []) => {
  const fd = new FormData();
  fd.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
  files.forEach((f) => f && fd.append("attachments", f));
  return axiosClient.post(`${BASE}/${type}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getContentById = (type, id) => axiosClient.get(`${BASE}/${type}/${id}`);

/**
 * @param {"announcements"|"homework"} type
 * @param {number} id
 * @param {object} data  JSON payload (includes keepAttachmentIds, archived flag, etc.)
 * @param {File[]} newFiles New attachment files to upload
 */
export const updateContent = (type, id, data, newFiles = []) => {
  const fd = new FormData();
  fd.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
  newFiles.forEach((f) => f && fd.append("attachments", f));
  return axiosClient.put(`${BASE}/${type}/${id}`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteContent = (type, id) => axiosClient.delete(`${BASE}/${type}/${id}`);

// ─── Archive year ──────────────────────────────────────────────────────────

export const archiveYear = (type, academicYear) =>
  axiosClient.post(`${BASE}/${type}/archive-year`, { academicYear });

// ─── Attachment download ───────────────────────────────────────────────────

export const downloadAttachment = async (attachmentId, originalFileName) => {
  const res = await axiosClient.get(
    `${BASE}/content-attachments/${attachmentId}/download`,
    { responseType: "blob" }
  );
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", originalFileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Returns the current academic year string, e.g. "2025/2026". */
export function getCurrentAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-based
  return month >= 9 ? `${year}/${year + 1}` : `${year - 1}/${year}`;
}

/** Format ISO datetime string for display. */
export function formatDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format ISO date string (YYYY-MM-DD) for display. */
export function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Returns true if the given date string is in the past. */
export function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}
