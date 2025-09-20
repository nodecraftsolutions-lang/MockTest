import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import Home from './pages/Home';
//import MockTests from './pages/MockTests';
//import About from './pages/About';
//import Contact from './pages/Contact';
import Auth from './pages/Auth';

// Student Pages
import StudentDashboard from './pages/Student/Dashboard';
//import ExamPattern from './pages/Student/ExamPattern';
import FreeTests from './pages/Student/FreeTests';
import PaidTests from './pages/Student/PaidTests';
import ExamInterface from './pages/Student/ExamInterface';
import Results from './pages/Student/Results';
import Orders from './pages/Student/Orders';
import Profile from './pages/Student/Profile';

// Admin Pages
//import AdminDashboard from './pages/Admin/Dashboard';
//import ManageCompanies from './pages/Admin/Companies';
//import ManageTests from './pages/Admin/Tests';
//import ManageStudents from './pages/Admin/Students';
//import AdminResults from './pages/Admin/Results';
//import ManagePayments from './pages/Admin/Payments';

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
             {/* <Route path="/mock-tests" element={<MockTests />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/auth" element={<Auth />} />
              */}
            </Route>

            {/* Student Dashboard Routes */}
            <Route path="/student" element={
              <ProtectedRoute requiredRole="student">
                <DashboardLayout />
              </ProtectedRoute>
            }>
             {/*} <Route index element={<StudentDashboard />} />
              <Route path="/exam-pattern" element={<ExamPattern />} />
              <Route path="/free-tests" element={<FreeTests />} />
              <Route path="/paid-tests" element={<PaidTests />} />
              <Route path="/results" element={<Results />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/profile" element={<Profile />} />
              */}
            </Route>

            {/* Exam Interface */}
            <Route path="/exam/:attemptId" element={
              <ProtectedRoute requiredRole="student">
                <ExamInterface />
              </ProtectedRoute>
            } />

            {/* Admin Dashboard Routes 
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="/companies" element={<ManageCompanies />} />
              <Route path="/tests" element={<ManageTests />} />
              <Route path="/students" element={<ManageStudents />} />
              <Route path="/results" element={<AdminResults />} />
              <Route path="/payments" element={<ManagePayments />} />
            </Route>
            */}
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;