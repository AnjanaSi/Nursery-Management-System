import axiosClient from "./axiosClient";

const ADMIN_BASE = "/api/v1/admin/gallery";
const PUBLIC_BASE = "/api/v1/public/gallery";

// ── Public ────────────────────────────────────────────────────────────────────

export const getPublicGallery = async () => {
  const res = await axiosClient.get(PUBLIC_BASE);
  return res.data;
};

// Returns a direct image URL (no auth required — served via public endpoint)
export const getGalleryPhotoImageUrl = (photoId) =>
  `${axiosClient.defaults.baseURL}/api/v1/public/gallery/photos/${photoId}/image`;

// ── Admin — Config ─────────────────────────────────────────────────────────────

export const getGalleryConfig = async () => {
  const res = await axiosClient.get(`${ADMIN_BASE}/config`);
  return res.data;
};

export const updateGalleryConfig = async (data) => {
  const res = await axiosClient.put(`${ADMIN_BASE}/config`, data);
  return res.data;
};

// ── Admin — Photos ─────────────────────────────────────────────────────────────

export const getAdminGalleryPhotos = async () => {
  const res = await axiosClient.get(`${ADMIN_BASE}/photos`);
  return res.data;
};

export const uploadGalleryPhoto = async (imageFile) => {
  const formData = new FormData();
  formData.append("image", imageFile);
  const res = await axiosClient.post(`${ADMIN_BASE}/photos`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const uploadGalleryPhotos = async (imageFiles) => {
  const formData = new FormData();
  imageFiles.forEach((f) => formData.append("images", f));
  const res = await axiosClient.post(`${ADMIN_BASE}/photos/batch`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const bulkDeleteGalleryPhotos = async (ids) => {
  const res = await axiosClient.post(`${ADMIN_BASE}/photos/bulk-delete`, ids);
  return res.data;
};

export const deleteGalleryPhoto = async (id) => {
  const res = await axiosClient.delete(`${ADMIN_BASE}/photos/${id}`);
  return res.data;
};

export const moveGalleryPhotoUp = async (id) => {
  const res = await axiosClient.put(`${ADMIN_BASE}/photos/${id}/move-up`);
  return res.data;
};

export const moveGalleryPhotoDown = async (id) => {
  const res = await axiosClient.put(`${ADMIN_BASE}/photos/${id}/move-down`);
  return res.data;
};
