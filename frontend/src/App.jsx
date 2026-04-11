import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import AdmissionsPage from "./pages/AdmissionsPage";
import PublicEventsPage from "./pages/PublicEventsPage";
import AdminDashboard from "./pages/AdminDashboard";
import PublicSiteDashboard from "./pages/PublicSiteDashboard";
import AdminEventsLandingPage from "./pages/AdminEventsLandingPage";
import AdminEventsListPage from "./pages/AdminEventsListPage";
import AdminEventFormPage from "./pages/AdminEventFormPage";
import AdminAboutSectionLandingPage from "./pages/AdminAboutSectionLandingPage";
import AdminAboutSectionCardsPage from "./pages/AdminAboutSectionCardsPage";
import AdminAboutSectionCardFormPage from "./pages/AdminAboutSectionCardFormPage";
import AdminProgramSectionLandingPage from "./pages/AdminProgramSectionLandingPage";
import AdminProgramSectionCardsPage from "./pages/AdminProgramSectionCardsPage";
import AdminProgramSectionCardFormPage from "./pages/AdminProgramSectionCardFormPage";
import GalleryPage from "./pages/GalleryPage";
import AdminGallerySectionLandingPage from "./pages/AdminGallerySectionLandingPage";
import AdminGallerySectionPhotosPage from "./pages/AdminGallerySectionPhotosPage";
import AdminGalleryPhotoUploadPage from "./pages/AdminGalleryPhotoUploadPage";
import AdminContactSectionPage from "./pages/AdminContactSectionPage";
import AdminAdmissionsPage from "./pages/AdminAdmissionsPage";
import AdminsLandingPage from "./pages/AdminsLandingPage";
import AdminsAddPage from "./pages/AdminsAddPage";
import AdminsListPage from "./pages/AdminsListPage";
import AdminsDetailPage from "./pages/AdminsDetailPage";
import StaffLandingPage from "./pages/StaffLandingPage";
import StaffAddPage from "./pages/StaffAddPage";
import StaffListPage from "./pages/StaffListPage";
import StaffDetailPage from "./pages/StaffDetailPage";
import StudentsLandingPage from "./pages/StudentsLandingPage";
import StudentFormPage from "./pages/StudentFormPage";
import StudentsListPage from "./pages/StudentsListPage";
import StudentDetailPage from "./pages/StudentDetailPage";
import YearTransitionPage from "./pages/YearTransitionPage";
import ParentLayout from "./components/ParentLayout";
import ParentAnnouncementsPage from "./pages/ParentAnnouncementsPage";
import ParentHomeworkPage from "./pages/ParentHomeworkPage";
import ParentChildProfilePage from "./pages/ParentChildProfilePage";
import TeacherAnnouncementsPage from "./pages/TeacherAnnouncementsPage";
import TeacherHomeworkPage from "./pages/TeacherHomeworkPage";
import TeacherProfilePage from "./pages/TeacherProfilePage";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";
import PublicSiteLayout from "./components/PublicSiteLayout";
import TeacherLayout from "./components/TeacherLayout";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/admissions" element={<AdmissionsPage />} />
        <Route path="/events" element={<PublicEventsPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Authenticated - force password change */}
        <Route path="/change-password" element={<ChangePasswordPage />} />

        {/* Admin routes */}
        <Route element={<ProtectedRoute allowedRole="ADMIN" />}>

          {/* Main admin area */}
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/admins" element={<AdminsLandingPage />} />
            <Route path="/admin/admins/new" element={<AdminsAddPage />} />
            <Route path="/admin/admins/list" element={<AdminsListPage />} />
            <Route path="/admin/admins/:id" element={<AdminsDetailPage />} />
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

          {/* Public Site Management area — own sidebar layout */}
          <Route element={<PublicSiteLayout />}>
            <Route path="/admin/public-site" element={<PublicSiteDashboard />} />
            <Route path="/admin/admissions" element={<AdminAdmissionsPage />} />
            <Route path="/admin/events" element={<AdminEventsLandingPage />} />
            <Route path="/admin/events/new" element={<AdminEventFormPage />} />
            <Route path="/admin/events/list" element={<AdminEventsListPage />} />
            <Route path="/admin/events/:id/edit" element={<AdminEventFormPage />} />
            <Route path="/admin/about-section" element={<AdminAboutSectionLandingPage />} />
            <Route path="/admin/about-section/cards" element={<AdminAboutSectionCardsPage />} />
            <Route path="/admin/about-section/cards/new" element={<AdminAboutSectionCardFormPage />} />
            <Route path="/admin/about-section/cards/:id/edit" element={<AdminAboutSectionCardFormPage />} />
            <Route path="/admin/programs" element={<AdminProgramSectionLandingPage />} />
            <Route path="/admin/programs/cards" element={<AdminProgramSectionCardsPage />} />
            <Route path="/admin/programs/cards/new" element={<AdminProgramSectionCardFormPage />} />
            <Route path="/admin/programs/cards/:id/edit" element={<AdminProgramSectionCardFormPage />} />
            <Route path="/admin/gallery" element={<AdminGallerySectionLandingPage />} />
            <Route path="/admin/gallery/photos" element={<AdminGallerySectionPhotosPage />} />
            <Route path="/admin/gallery/photos/upload" element={<AdminGalleryPhotoUploadPage />} />
            <Route path="/admin/contact" element={<AdminContactSectionPage />} />
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

        {/* Parent routes with sidebar layout */}
        <Route element={<ProtectedRoute allowedRole="PARENT" />}>
          <Route element={<ParentLayout />}>
            <Route path="/parent" element={<Navigate to="/parent/announcements" replace />} />
            <Route path="/parent/announcements" element={<ParentAnnouncementsPage />} />
            <Route path="/parent/homework" element={<ParentHomeworkPage />} />
            <Route path="/parent/child-profile" element={<ParentChildProfilePage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
