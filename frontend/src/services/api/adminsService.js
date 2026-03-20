import axiosClient from "./axiosClient";

const BASE = "/api/v1/admin/admins";

export const getAdminsList = async ({
  search,
  adminType,
  accountStatus,
  page = 0,
  size = 10,
} = {}) => {
  const params = { page, size };
  if (search) params.search = search;
  if (adminType) params.adminType = adminType;
  if (accountStatus) params.accountStatus = accountStatus;
  const res = await axiosClient.get(BASE, { params });
  return res.data;
};

export const getAdminById = async (id) => {
  const res = await axiosClient.get(`${BASE}/${id}`);
  return res.data;
};

export const createAdmin = async (data) => {
  const res = await axiosClient.post(BASE, data);
  return res.data;
};

export const createAdminWithAccount = async (data) => {
  const res = await axiosClient.post(`${BASE}/with-account`, data);
  return res.data;
};

export const updateAdmin = async (id, data) => {
  const res = await axiosClient.put(`${BASE}/${id}`, data);
  return res.data;
};

export const deleteAdmin = async (id) => {
  const res = await axiosClient.delete(`${BASE}/${id}`);
  return res.data;
};

export const createAdminAccount = async (id) => {
  const res = await axiosClient.post(`${BASE}/${id}/account`);
  return res.data;
};

export const disableAdminAccount = async (id) => {
  const res = await axiosClient.delete(`${BASE}/${id}/account`);
  return res.data;
};
