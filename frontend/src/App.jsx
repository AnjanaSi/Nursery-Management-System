import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute allowedRole="ADMIN" />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
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
