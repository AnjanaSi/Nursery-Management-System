import axiosClient from "./axiosClient";

const BASE = "/api/v1/admin/staff";

export const getStaffList = async ({
  search,
  status,
  level,
  designation,
  page = 0,
  size = 10,
} = {}) => {
  const params = { page, size };
  if (search) params.search = search;
  if (status) params.status = status;
  if (level) params.level = level;
  if (designation) params.designation = designation;
  const res = await axiosClient.get(BASE, { params });
  return res.data;
};

export const getStaffById = async (id) => {
  const res = await axiosClient.get(`${BASE}/${id}`);
  return res.data;
};

export const createStaff = async (data, photoFile) => {
  const formData = new FormData();
  formData.append(
    "data",
    new Blob([JSON.stringify(data)], { type: "application/json" }),
  );
  if (photoFile) formData.append("profilePhoto", photoFile);
  const res = await axiosClient.post(BASE, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const createStaffWithAccount = async (data, photoFile) => {
  const formData = new FormData();
  formData.append(
    "data",
    new Blob([JSON.stringify(data)], { type: "application/json" }),
  );
  if (photoFile) formData.append("profilePhoto", photoFile);
  const res = await axiosClient.post(`${BASE}/with-account`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateStaff = async (id, data, photoFile) => {
  const formData = new FormData();
  formData.append(
    "data",
    new Blob([JSON.stringify(data)], { type: "application/json" }),
  );
  if (photoFile) formData.append("profilePhoto", photoFile);
  const res = await axiosClient.put(`${BASE}/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteStaff = async (id) => {
  const res = await axiosClient.delete(`${BASE}/${id}`);
  return res.data;
};

export const createStaffAccount = async (teacherId) => {
  const res = await axiosClient.post(`${BASE}/${teacherId}/account`);
  return res.data;
};

export const revokeStaffAccount = async (teacherId) => {
  const res = await axiosClient.delete(`${BASE}/${teacherId}/account`);
  return res.data;
};

// export const getStaffPhotoUrl = (id) => {
//   const token = localStorage.getItem("auth_token");
//   return `http://localhost:8080${BASE}/${id}/photo?token=${token}`;
// };

export const fetchStaffPhotoBlob = async (id) => {
  const res = await axiosClient.get(`${BASE}/${id}/photo`, {
    responseType: "blob",
  });
  return res.data;
};
