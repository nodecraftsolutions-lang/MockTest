import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import Home from './pages/Home';
import MockTests from './pages/MockTests'; // public page
import About from './pages/About';
import Contact from './pages/Contact';
import Auth from './pages/Auth';

// Student Pages
import StudentDashboard from './pages/Student/Dashboard';
import ExamPattern from './pages/Student/ExamPattern';
import FreeTests from './pages/Student/FreeTests';
import PaidTests from './pages/Student/PaidTests';
import ExamInterface from './pages/Student/ExamInterface';
import Results from './pages/Student/Results';
import ResultDetail from './pages/Student/ResultDetail';
import Orders from './pages/Student/Orders';
import Profile from './pages/Student/Profile';
import Leaderboard from './pages/Student/Leaderboard';
import Courses from './pages/Student/Courses';
import MyCourses from './pages/Student/MyCourses';
import CourseDetails from './pages/Student/CourseDetail';
import StudentMockTests from './pages/Student/MockTests'; // ✅ student company list
import CompanyDetails from './pages/Student/CompanyDetails';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import ManageCompanies from './pages/Admin/Companies';
import ManageTests from './pages/Admin/Tests';
import ManageStudents from './pages/Admin/Students';
import AdminResults from './pages/Admin/Results';
import ManagePayments from './pages/Admin/Payments';
import AdminSettings from './pages/Admin/Settings';

import './index.css';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="mock-tests" element={<MockTests />} />
              <Route path="about" element={<About />} />
              <Route path="contact" element={<Contact />} />
              <Route path="auth" element={<Auth />} />
            </Route>

            {/* Student Dashboard Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute requiredRole="student">
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<StudentDashboard />} />
              <Route path="exam-pattern" element={<ExamPattern />} />
              <Route path="free-tests" element={<FreeTests />} />
              <Route path="paid-tests" element={<PaidTests />} />
              <Route path="exam/:testId" element={<ExamInterface />} />
              
              {/* Mock Tests */}
              <Route path="mock-tests" element={<StudentMockTests />} />
              <Route path="mock-tests/:companyId" element={<CompanyDetails />} />

              {/* Courses */}
              <Route path="courses" element={<Courses />} />
              <Route path="courses/:id" element={<CourseDetails />} />
              <Route path="my-courses" element={<MyCourses />} />

              {/* Results */}
              <Route path="results" element={<Results />} />
              <Route path="results/:attemptId" element={<ResultDetail />} />

              {/* Other Pages */}
              <Route path="orders" element={<Orders />} />
              <Route path="profile" element={<Profile />} />
              <Route path="leaderboard" element={<Leaderboard />} />
            </Route>

            {/* Admin Dashboard Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="companies" element={<ManageCompanies />} />
              <Route path="tests" element={<ManageTests />} />
              <Route path="students" element={<ManageStudents />} />
              <Route path="results" element={<AdminResults />} />
              <Route path="payments" element={<ManagePayments />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
