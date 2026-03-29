import axiosClient from "./axiosClient";

const ADMIN_BASE = "/api/v1/admin/about";
const PUBLIC_BASE = "/api/v1/public/about";

// ── Public ────────────────────────────────────────────────────────────────────

export const getPublicAbout = async () => {
  const res = await axiosClient.get(PUBLIC_BASE);
  return res.data;
};

// Returns a direct image URL (no auth required — served via public endpoint)
export const getAboutCardImageUrl = (cardId) =>
  `${axiosClient.defaults.baseURL}/api/v1/public/about/cards/${cardId}/image`;

// ── Admin — Config ─────────────────────────────────────────────────────────────

export const getAboutConfig = async () => {
  const res = await axiosClient.get(`${ADMIN_BASE}/config`);
  return res.data;
};

export const updateAboutConfig = async (data) => {
  const res = await axiosClient.put(`${ADMIN_BASE}/config`, data);
  return res.data;
};

// ── Admin — Cards ──────────────────────────────────────────────────────────────

export const getAdminAboutCards = async () => {
  const res = await axiosClient.get(`${ADMIN_BASE}/cards`);
  return res.data;
};

export const getAdminAboutCard = async (id) => {
  const res = await axiosClient.get(`${ADMIN_BASE}/cards/${id}`);
  return res.data;
};

export const createAboutCard = async (data, imageFile) => {
  const formData = new FormData();
  formData.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
  if (imageFile) formData.append("image", imageFile);
  const res = await axiosClient.post(`${ADMIN_BASE}/cards`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateAboutCard = async (id, data, imageFile) => {
  const formData = new FormData();
  formData.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
  if (imageFile) formData.append("image", imageFile);
  const res = await axiosClient.put(`${ADMIN_BASE}/cards/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteAboutCard = async (id) => {
  const res = await axiosClient.delete(`${ADMIN_BASE}/cards/${id}`);
  return res.data;
};

export const moveAboutCardUp = async (id) => {
  const res = await axiosClient.put(`${ADMIN_BASE}/cards/${id}/move-up`);
  return res.data;
};

export const moveAboutCardDown = async (id) => {
  const res = await axiosClient.put(`${ADMIN_BASE}/cards/${id}/move-down`);
  return res.data;
};
