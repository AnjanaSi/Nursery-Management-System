import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import StudentsLandingPage from "./pages/StudentsLandingPage";
import StudentFormPage from "./pages/StudentFormPage";
import StudentsListPage from "./pages/StudentsListPage";
import StudentDetailPage from "./pages/StudentDetailPage";
import YearTransitionPage from "./pages/YearTransitionPage";
import ParentDashboard from "./pages/ParentDashboard";
import TeacherAnnouncementsPage from "./pages/TeacherAnnouncementsPage";
import TeacherHomeworkPage from "./pages/TeacherHomeworkPage";
import TeacherProfilePage from "./pages/TeacherProfilePage";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import TeacherLayout from "./components/TeacherLayout";

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
            <Route path="/admin/students" element={<StudentsLandingPage />} />
            <Route path="/admin/students/new" element={<StudentFormPage />} />
            <Route path="/admin/students/list" element={<StudentsListPage />} />
            <Route path="/admin/students/year-transition" element={<YearTransitionPage />} />
            <Route path="/admin/students/:id/edit" element={<StudentFormPage />} />
            <Route path="/admin/students/:id" element={<StudentDetailPage />} />
          </Route>
        </Route>

        {/* Teacher routes with sidebar layout */}
        <Route element={<ProtectedRoute allowedRole="TEACHER" />}>
          <Route element={<TeacherLayout />}>
            <Route path="/teacher" element={<Navigate to="/teacher/announcements" replace />} />
            <Route path="/teacher/announcements" element={<TeacherAnnouncementsPage />} />
            <Route path="/teacher/homework" element={<TeacherHomeworkPage />} />
            <Route path="/teacher/profile" element={<TeacherProfilePage />} />
          </Route>
        </Route>

        {/* Parent routes */}
        <Route element={<ProtectedRoute allowedRole="PARENT" />}>
          <Route path="/parent" element={<ParentDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
