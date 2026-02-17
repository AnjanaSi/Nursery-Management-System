import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated, getRole, getMustChangePassword } from "../services/authService";

const ROLE_PATHS = {
  ADMIN: "/admin",
  TEACHER: "/teacher",
  PARENT: "/parent",
};

export default function ProtectedRoute({ allowedRole }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (getMustChangePassword() && location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  const userRole = getRole();
  if (userRole !== allowedRole) {
    const correctPath = ROLE_PATHS[userRole] || "/login";
    return <Navigate to={correctPath} replace />;
  }

  return <Outlet />;
}
