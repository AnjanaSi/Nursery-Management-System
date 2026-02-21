import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import AdmissionsPage from "./pages/AdmissionsPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminAdmissionsPage from "./pages/AdminAdmissionsPage";
import StaffLandingPage from "./pages/StaffLandingPage";
import StaffAddPage from "./pages/StaffAddPage";
import StaffListPage from "./pages/StaffListPage";
import StaffDetailPage from "./pages/StaffDetailPage";
import TeacherDashboard from "./pages/TeacherDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/admissions" element={<AdmissionsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Authenticated - force password change */}
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* Admin routes with sidebar layout */}
        <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/admissions" element={<AdminAdmissionsPage />} />
            <Route path="/admin/staff" element={<StaffLandingPage />} />
            <Route path="/admin/staff/new" element={<StaffAddPage />} />
            <Route path="/admin/staff/list" element={<StaffListPage />} />
            <Route path="/admin/staff/:id" element={<StaffDetailPage />} />
          </Route>
        </Route>

        {/* Other role routes */}
        <Route element={<ProtectedRoute allowedRole="TEACHER" />}>
          <Route path="/teacher" element={<TeacherDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allowedRole="PARENT" />}>
          <Route path="/parent" element={<ParentDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
