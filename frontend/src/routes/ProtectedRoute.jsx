import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated, getRole } from "../services/authService";

const ROLE_PATHS = {
  ADMIN: "/admin",
  TEACHER: "/teacher",
  PARENT: "/parent",
};

export default function ProtectedRoute({ allowedRole }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const userRole = getRole();
  if (userRole !== allowedRole) {
    const correctPath = ROLE_PATHS[userRole] || "/login";
    return <Navigate to={correctPath} replace />;
  }

  return <Outlet />;
}
