import axiosClient from "./axiosClient";

const ADMIN_BASE = "/api/v1/admin/contact";
const PUBLIC_BASE = "/api/v1/public/contact";

// ── Public ────────────────────────────────────────────────────────────────────

export const getPublicContact = async () => {
  const res = await axiosClient.get(PUBLIC_BASE);
  return res.data;
};

// ── Admin — Config ─────────────────────────────────────────────────────────────

export const getContactConfig = async () => {
  const res = await axiosClient.get(`${ADMIN_BASE}/config`);
  return res.data;
};

export const updateContactConfig = async (data) => {
  const res = await axiosClient.put(`${ADMIN_BASE}/config`, data);
  return res.data;
};

// ── Admin — Items ──────────────────────────────────────────────────────────────

export const getContactItems = async () => {
  const res = await axiosClient.get(`${ADMIN_BASE}/items`);
  return res.data;
};

export const updateContactItem = async (id, data) => {
  const res = await axiosClient.put(`${ADMIN_BASE}/items/${id}`, data);
  return res.data;
};
