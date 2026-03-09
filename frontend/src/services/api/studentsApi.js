import axiosClient from "./axiosClient";

const BASE = "/api/v1/admin/students";

export const getStudents = async ({
  search,
  level,
  status,
  batchCode,
  page = 0,
  size = 10,
} = {}) => {
  const params = { page, size };
  if (search) params.search = search;
  if (level) params.level = level;
  if (status) params.status = status;
  if (batchCode) params.batchCode = batchCode;
  const res = await axiosClient.get(BASE, { params });
  return res.data;
};

export const getStudentById = async (id) => {
  const res = await axiosClient.get(`${BASE}/${id}`);
  return res.data;
};

export const createStudent = async (data, photoFile, createAccounts = false) => {
  const formData = new FormData();
  formData.append(
    "data",
    new Blob([JSON.stringify(data)], { type: "application/json" }),
  );
  if (photoFile) formData.append("profilePhoto", photoFile);
  const res = await axiosClient.post(`${BASE}?createAccounts=${createAccounts}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateStudent = async (id, data, photoFile, createAccounts = false) => {
  const formData = new FormData();
  formData.append(
    "data",
    new Blob([JSON.stringify(data)], { type: "application/json" }),
  );
  if (photoFile) formData.append("profilePhoto", photoFile);
  const res = await axiosClient.put(`${BASE}/${id}?createAccounts=${createAccounts}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteStudent = async (id) => {
  const res = await axiosClient.delete(`${BASE}/${id}`);
  return res.data;
};

export const changeStudentStatus = async (id, statusData) => {
  const res = await axiosClient.put(`${BASE}/${id}/status`, statusData);
  return res.data;
};

export const createGuardianAccount = async (studentId, guardianId) => {
  const res = await axiosClient.post(`${BASE}/${studentId}/guardians/${guardianId}/account`);
  return res.data;
};

export const revokeGuardianAccount = async (studentId, guardianId) => {
  const res = await axiosClient.delete(`${BASE}/${studentId}/guardians/${guardianId}/account`);
  return res.data;
};

export const fetchStudentPhotoBlob = async (id) => {
  const res = await axiosClient.get(`${BASE}/${id}/photo`, {
    responseType: "blob",
  });
  return res.data;
};

export const bulkPromote = async (body) => {
  const res = await axiosClient.post(`${BASE}/bulk/promote`, body);
  return res.data;
};

export const bulkExit = async (body) => {
  const res = await axiosClient.post(`${BASE}/bulk/exit`, body);
  return res.data;
};
