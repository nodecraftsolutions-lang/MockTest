import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';

//mock test bages
import CreateCompany from './pages/Admin/MockTest/CreateCompany'
import TestCreation from './pages/Admin/MockTest/TestCreation'
import QuestionBankUpload from './pages/Admin/MockTest/QuestionBankUpload'

//course

import CourseCreation from './pages/Admin/Course/CourseCreation'
import CourseSessions from './pages/Admin/Course/CourseSessions'
import CoursesList from './pages/Admin/Course/CourseList'

//recordings
import RecordingsManagement from './pages/Admin/Recordings/RecordingsManagement';

// Public Pages
import Home from './pages/Home';
import MockTests from './pages/MockTests';
import About from './pages/About';
import Contact from './pages/Contact';
import Auth from './pages/Auth';

// Student Pages
import StudentDashboard from './pages/Student/Dashboard';
import FreeTests from './pages/Student/FreeTests';
import PaidTests from './pages/Student/PaidTests';
import ExamInterface from './pages/Student/ExamInterface';
import Results from './pages/Student/Results';
import ResultDetail from './pages/Student/ResultDetail'; // ✅ import
import Orders from './pages/Student/Orders';
import Profile from './pages/Student/Profile';
import Leaderboard from './pages/Student/Leaderboard';
import Courses from './pages/Student/Courses';
import MyCourses from './pages/Student/MyCourses';
import CourseDetails from './pages/Student/CourseDetail';
import CompanyList from './pages/Student/CompanyList'; // ✅ import
import CompanyDetails from './pages/Student/CompanyDetails'; // ✅ import
import CourseLearn from './pages/Student/CourseLearn'; // ✅ import
import Recordings from './pages/Student/Recordings';
import RecordingsPage from './pages/Student/RecordingsPage';
// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import ManageCompanies from './pages/Admin/Companies';
import ManageTests from './pages/Admin/Tests';
import QuestionBanks from './pages/Admin/QuestionBanks';
import ManageStudents from './pages/Admin/Students';
import AdminResults from './pages/Admin/Results';
import ManagePayments from './pages/Admin/Payments';
import AdminSettings from './pages/Admin/Settings';

import './index.css';
import DynamicGenerateQuestions from './pages/Admin/MockTest/GenerateQuestions';


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
              <Route path="free-tests" element={<FreeTests />} />
              <Route path="paid-tests" element={<PaidTests />} />
              {/* Exam Interface */}
              <Route path="exam/:testId" element={<ExamInterface />} />
              {/* ✅ Company Tests */}
              <Route path="mock-tests" element={<CompanyList />} />
              <Route path="mock-tests/:companyId" element={<CompanyDetails />} />
              <Route path="exam/:testId" element={<ExamInterface />} />

              {/* ✅ Courses */}
              <Route path="courses" element={<Courses />} />
              <Route path="courses/:id" element={<CourseDetails />} />
              <Route path="my-courses" element={<MyCourses />} />
              <Route path="courses/:id/learn" element={<CourseLearn />} />
              {/* ✅ Results */}
              <Route path="results" element={<Results />} />
              <Route path="results/:attemptId" element={<ResultDetail />} />
              {/* Recordings */ }
              <Route path="/student/recordings" element={<Recordings />} />
              <Route path="/student/recordings/:courseId" element={<RecordingsPage />} />

              {/* ✅ Other Pages */}
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
              <Route path="/admin/mocktest/create-company"element={<CreateCompany/>}/>
              <Route path="/admin/mocktest/test-creation"element={<TestCreation/>}/>
              <Route path="/admin/mocktest/question-bank-upload" element={<QuestionBankUpload/>}/>
              <Route path="/admin/mocktest/question-generate" element={<DynamicGenerateQuestions/>}/>


              <Route path="/admin/course/create" element={<CourseCreation/>}/>
              <Route path="/admin/course/sessions" element={<CourseSessions/>}/>
              <Route path="/admin/course/list" element={<CoursesList/>}/>


              <Route path="/admin/recordings/upload" element={<RecordingsManagement/>}/>





              <Route index element={<AdminDashboard />} />
              <Route path="companies" element={<ManageCompanies />} />
              <Route path="tests" element={<ManageTests />} />
              <Route path="question-banks" element={<QuestionBanks />} />
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
