import axiosClient from "./axiosClient";

const API_PUBLIC = "/api/v1/public/admissions";
const API_ADMIN = "/api/v1/admin/admissions";

// ======================== PUBLIC ========================

export async function getPublicAnnouncement() {
  const res = await axiosClient.get(`${API_PUBLIC}/announcement`);
  return res.data;
}

export function getAnnouncementPdfUrl() {
  return `http://localhost:8080${API_PUBLIC}/announcement/pdf`;
}

export async function submitApplication(formData) {
  const res = await axiosClient.post(`${API_PUBLIC}/submissions`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// ======================== ADMIN ========================

export async function getAdminAnnouncement() {
  const res = await axiosClient.get(`${API_ADMIN}/announcement`);
  return res.data;
}

export async function createOrUpdateAnnouncement(formData) {
  const res = await axiosClient.post(`${API_ADMIN}/announcement`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function getSubmissions({ search, status, level, page = 0, size = 10 }) {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (status) params.append("status", status);
  if (level) params.append("level", level);
  params.append("page", page);
  params.append("size", size);

  const res = await axiosClient.get(`${API_ADMIN}/submissions?${params.toString()}`);
  return res.data;
}

export async function getSubmissionById(id) {
  const res = await axiosClient.get(`${API_ADMIN}/submissions/${id}`);
  return res.data;
}

export async function updateSubmissionStatus(id, status) {
  const res = await axiosClient.put(`${API_ADMIN}/submissions/${id}/status`, { status });
  return res.data;
}

export async function updateSubmissionNote(id, adminNote) {
  const res = await axiosClient.put(`${API_ADMIN}/submissions/${id}/note`, { adminNote });
  return res.data;
}

export async function downloadSubmissionPdf(id) {
  const res = await axiosClient.get(`${API_ADMIN}/submissions/${id}/pdf`, {
    responseType: "blob",
  });
  const url = window.URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `submission-${id}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
