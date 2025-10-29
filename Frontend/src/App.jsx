import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ResponsiveProvider } from './context/ResponsiveContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';
import ScrollToTop from './components/ScrollToTop';

// Mock Test Pages
import CompanyTestManagement from './pages/Admin/MockTest/CompanyTestManagement';
import CreateCompany from './pages/Admin/MockTest/CreateCompany';
import TestCreation from './pages/Admin/MockTest/TestCreation';
import QuestionBankUpload from './pages/Admin/MockTest/QuestionBankUpload';

// Course Pages
import CourseCreation from './pages/Admin/Course/CourseCreation';
import CourseSessions from './pages/Admin/Course/CourseSessions';
import CoursesList from './pages/Admin/Course/CourseList';
import CourseManagement from './pages/Admin/Course/CourseManagement';

// Recordings
import RecordingsManagement from './pages/Admin/Recordings/RecordingsManagement';

// Public Pages
import Home from './pages/Home';
import MockTests from './pages/MockTests';
import About from './pages/About';
import Auth from './pages/Auth';
import Terms from './pages/Terms';
import PrivacyPolicy from './pages/PrivacyPolicy';

// Student Pages
import StudentDashboard from './pages/Student/Dashboard';
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
import CompanyList from './pages/Student/CompanyList';
import CompanyDetails from './pages/Student/CompanyDetails';
import CourseLearn from './pages/Student/CourseLearn';
import Recordings from './pages/Student/Recordings';
import RecordingsPage from './pages/Student/RecordingsPage';
import AllRecordings from './pages/Student/AllRecordings';
// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import ManageCompanies from './pages/Admin/Companies';
import ManageTests from './pages/Admin/Tests';
import QuestionBanks from './pages/Admin/QuestionBanks';
import ManageStudents from './pages/Admin/Students';
import ManageAlumni from './pages/Admin/Alumni';
import AdminResults from './pages/Admin/Results';
import ManagePayments from './pages/Admin/Payments';
import PaidTestsAnalytics from './pages/Admin/PaidTestsAnalytics'; // Add this import
import AdminSettings from './pages/Admin/Settings';
import Enrollments from './pages/Admin/Enrollments/Enrollments';
import NotFound3D from './pages/NotFound3D'
import ColorTest from './components/ColorTest';
import DynamicGenerateQuestions from './pages/Admin/MockTest/GenerateQuestions';
import ResourceManagement from './pages/Admin/Course/ResourceManagement';
import ResourceRecordManagement from './pages/Admin/Course/ResourceRecordManagement';
import DiscussionsManagement from './pages/Admin/Course/DiscussionsManagement';
import AdminMailPage from './pages/AdminMailPage';
import ContactPage from './pages/ContactPage';
import GlobalContactWidget from './pages/GlobalContactWidget';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ResponsiveProvider>
          <Router>
            <ScrollToTop />
            <Routes>
            {/* Public Routes */}
            <Route path="*" element={<NotFound3D />} />
            <Route path="/" element={<PublicLayout />}>
              <Route index element={<Home />} />
              <Route path="mock-tests" element={<MockTests />} />
              <Route path="about" element={<About />} />
              <Route path="mailtoall" element={<AdminMailPage />} />
              <Route path="auth" element={<Auth />} />
              <Route path="color-test" element={<ColorTest />} />
              <Route path="terms" element={<Terms />} />
              <Route path="privacy-policy" element={<PrivacyPolicy />} />
              <Route path="contact" element={<ContactPage />} />
            </Route>
            
            {/* Standalone Public Pages */}
            {/* <Route path="/terms" element={<Terms />} /> */}

            {/* Student Dashboard */}
            <Route
              path="/student"
              element={
                <ProtectedRoute requiredRole="student">
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<StudentDashboard />} />
              <Route path="free-tests" element={<FreeTests />} />
              <Route path="paid-tests" element={<PaidTests />} />
              <Route path="exam/:testId" element={<ExamInterface />} />
              <Route path="mock-tests" element={<CompanyList />} />
              <Route path="mock-tests/:companyId" element={<CompanyDetails />} />
              <Route path="courses" element={<Courses />} />
              <Route path="courses/:id" element={<CourseDetails />} />
              <Route path="my-courses" element={<MyCourses />} />
              <Route path="courses/:id/learn" element={<CourseLearn />} />
              <Route path="results" element={<Results />} />
              <Route path="results/:attemptId" element={<ResultDetail />} />
              {/* Recordings */ }
              <Route path="/student/recordings" element={<Recordings />} />
              <Route path="/student/recordings/:courseId" element={<RecordingsPage />} />
              <Route path="/student/all-recordings" element={<AllRecordings />} />

              {/* ✅ Other Pages */}
              <Route path="orders" element={<Orders />} />
              <Route path="profile" element={<Profile />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="contact" element={<ContactPage />} />
            </Route>

            {/* Admin Dashboard */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="mocktest" element={<CompanyTestManagement />} />
              <Route path="mocktest/question-generate" element={<DynamicGenerateQuestions />} />
              <Route path="mocktest/question-bank-upload" element={<QuestionBankUpload />} />
              <Route path="mocktest/create-company" element={<CreateCompany />} />
              <Route path="mocktest/test-creation" element={<TestCreation />} />
              <Route path="course/create" element={<CourseCreation />} />
              <Route path="course/sessions" element={<CourseSessions />} />
              <Route path="course/list" element={<CoursesList />} />
              <Route path="course/management" element={<CourseManagement />} />
              <Route path="recordings/upload" element={<RecordingsManagement />} />
              <Route path="course/resources" element={<ResourceManagement />} />
              <Route path="course/resourcesrec" element={<ResourceRecordManagement />} />
              <Route path="course/discussions" element={<DiscussionsManagement />} />
              <Route path="companies" element={<ManageCompanies />} />
              <Route path="tests" element={<ManageTests />} />
              <Route path="question-banks" element={<QuestionBanks />} />
              <Route path="students" element={<ManageStudents />} />
              <Route path="alumni" element={<ManageAlumni />} />
              <Route path="results" element={<AdminResults />} />
              <Route path="payments" element={<ManagePayments />} />
              <Route path="paid-tests-analytics" element={<PaidTestsAnalytics />} /> {/* Add this route */}
              <Route path="enrollments" element={<Enrollments />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="mail" element={<AdminMailPage />} />
            </Route>
          </Routes>

          {/* 🌐 Global Floating Contact Widget */}
          <GlobalContactWidget />
        </Router>
      </ResponsiveProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
