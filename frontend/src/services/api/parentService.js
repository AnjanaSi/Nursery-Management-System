import axiosClient from "./axiosClient";

const BASE = "/api/v1/parent";

// ─── Children ───────────────────────────────────────────────────────────────

export const getChildren = () => axiosClient.get(`${BASE}/children`);

export const getChildProfile = (studentId) =>
  axiosClient.get(`${BASE}/children/${studentId}/profile`);

// ─── Announcements ──────────────────────────────────────────────────────────

export const listAnnouncements = (studentId, { page = 0, size = 10 } = {}) =>
  axiosClient.get(`${BASE}/children/${studentId}/announcements`, {
    params: { page, size },
  });

export const getAnnouncementDetail = (contentId, studentId) =>
  axiosClient.get(`${BASE}/announcements/${contentId}`, {
    params: { studentId },
  });

export const markAnnouncementViewed = (studentId, contentId) =>
  axiosClient.post(`${BASE}/children/${studentId}/announcements/${contentId}/view`);

// ─── Homework ───────────────────────────────────────────────────────────────

export const listHomework = (studentId, { page = 0, size = 10 } = {}) =>
  axiosClient.get(`${BASE}/children/${studentId}/homework`, {
    params: { page, size },
  });

export const getHomeworkDetail = (contentId, studentId) =>
  axiosClient.get(`${BASE}/homework/${contentId}`, {
    params: { studentId },
  });

export const markHomeworkViewed = (studentId, contentId) =>
  axiosClient.post(`${BASE}/children/${studentId}/homework/${contentId}/view`);

// ─── Attachments ─────────────────────────────────────────────────────────────

export const downloadAttachment = async (attachmentId, studentId, originalFileName) => {
  const res = await axiosClient.get(
    `${BASE}/content-attachments/${attachmentId}/download`,
    { params: { studentId }, responseType: "blob" }
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

// ─── Re-exported helpers ─────────────────────────────────────────────────────

export { formatDateTime, formatDate, isOverdue } from "./teacherService";
