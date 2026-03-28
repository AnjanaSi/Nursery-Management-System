import axiosClient from "./axiosClient";

const ADMIN_BASE = "/api/v1/admin/events";
const PUBLIC_BASE = "/api/v1/public/events";

// ── Admin endpoints ──────────────────────────────────────────────────────────

export const createEvent = async (data, photoFiles = []) => {
  const formData = new FormData();
  formData.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
  photoFiles.forEach((f) => formData.append("photos", f));
  const res = await axiosClient.post(ADMIN_BASE, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateEvent = async (id, data, photoFiles = []) => {
  const formData = new FormData();
  formData.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
  photoFiles.forEach((f) => formData.append("photos", f));
  const res = await axiosClient.put(`${ADMIN_BASE}/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getAdminEventsList = async ({ search, page = 0, size = 10 } = {}) => {
  const params = { page, size };
  if (search) params.search = search;
  const res = await axiosClient.get(ADMIN_BASE, { params });
  return res.data;
};

export const getAdminEventById = async (id) => {
  const res = await axiosClient.get(`${ADMIN_BASE}/${id}`);
  return res.data;
};

export const deleteEvent = async (id) => {
  const res = await axiosClient.delete(`${ADMIN_BASE}/${id}`);
  return res.data;
};

export const bulkDeleteEvents = async (ids) => {
  const res = await axiosClient.post(`${ADMIN_BASE}/bulk-delete`, { ids });
  return res.data;
};

// ── Public endpoints ─────────────────────────────────────────────────────────

export const getPublicEvents = async ({ page = 0, size = 9 } = {}) => {
  const res = await axiosClient.get(PUBLIC_BASE, { params: { page, size } });
  return res.data;
};

export const getPublicEventById = async (id) => {
  const res = await axiosClient.get(`${PUBLIC_BASE}/${id}`);
  return res.data;
};

// Returns a direct URL for use in <img src> — public endpoint, no auth needed.
// Uses axiosClient.defaults.baseURL so it follows the same base URL configuration.
export const getEventPhotoUrl = (photoId) =>
  `${axiosClient.defaults.baseURL}/api/v1/public/events/photos/${photoId}/image`;
