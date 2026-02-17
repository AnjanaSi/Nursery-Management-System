import axiosClient from "./api/axiosClient";

const ROLE_PATHS = {
  ADMIN: "/admin",
  TEACHER: "/teacher",
  PARENT: "/parent",
};

export function getToken() {
  return localStorage.getItem("auth_token");
}

export function getRole() {
  return localStorage.getItem("auth_role");
}

export function getEmail() {
  return localStorage.getItem("auth_email");
}

export function getMustChangePassword() {
  return localStorage.getItem("auth_must_change_password") === "true";
}

export function isAuthenticated() {
  return !!getToken();
}

export function getRolePath(role) {
  return ROLE_PATHS[role] || "/login";
}

export async function login(email, password) {
  const response = await axiosClient.post("/api/v1/auth/login", {
    email,
    password,
  });
  const body = response.data;
  if (!body.success) {
    throw new Error(body.message || "Login failed");
  }
  const { token, role, email: userEmail, mustChangePassword } = body.data;
  localStorage.setItem("auth_token", token);
  localStorage.setItem("auth_role", role);
  localStorage.setItem("auth_email", userEmail);
  localStorage.setItem("auth_must_change_password", String(mustChangePassword));
  return body.data;
}

export function logout() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_role");
  localStorage.removeItem("auth_email");
  localStorage.removeItem("auth_must_change_password");
}

export async function changePassword(currentPassword, newPassword) {
  const response = await axiosClient.post("/api/v1/auth/change-password", {
    currentPassword,
    newPassword,
  });
  const body = response.data;
  if (!body.success) {
    throw new Error(body.error || "Password change failed");
  }
  localStorage.setItem("auth_must_change_password", "false");
  return body.data;
}

export async function requestPasswordReset(email) {
  const response = await axiosClient.post("/api/v1/auth/forgot-password", {
    email,
  });
  const body = response.data;
  if (!body.success) {
    throw new Error(body.error || "Request failed");
  }
  return body.data;
}

export async function resetPassword(token, newPassword) {
  const response = await axiosClient.post("/api/v1/auth/reset-password", {
    token,
    newPassword,
  });
  const body = response.data;
  if (!body.success) {
    throw new Error(body.error || "Reset failed");
  }
  return body.data;
}
