import { useState, useEffect } from 'react';
import { Search, Filter, Download, BookOpen, Video, User } from 'lucide-react';
import api from '../../../api/axios';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useToast } from '../../../context/ToastContext';

const Enrollments = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courseEnrollments, setCourseEnrollments] = useState([]);
  const [recordingUnlocks, setRecordingUnlocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('courses'); // 'courses' or 'recordings'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const { showError, showSuccess } = useToast();

  // Fetch all courses on component mount
  useEffect(() => {
    fetchCourses();
  }, []);

  // Fetch enrollments when course, tab, or page changes
  useEffect(() => {
    if (selectedCourse) {
      fetchEnrollments();
    }
  }, [selectedCourse, activeTab, currentPage, searchTerm]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/courses/admin/all');
      setCourses(response.data.data || []);
    } catch (error) {
      showError('Failed to fetch courses');
      console.error('Fetch courses error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEnrollments = async () => {
    if (!selectedCourse) return;
    
    setLoading(true);
    try {
      let endpoint = '';
      let params = {
        fetchAll: 'true', // Fetch all enrollments
        search: searchTerm
      };

      if (activeTab === 'courses') {
        endpoint = `/enrollments/admin/courses/${selectedCourse}`;
      } else {
        endpoint = `/enrollments/admin/recordings/${selectedCourse}`;
      }

      const response = await api.get(endpoint, { params });
      
      if (activeTab === 'courses') {
        setCourseEnrollments(response.data.data.enrollments || []);
      } else {
        setRecordingUnlocks(response.data.data.enrollments || []);
      }
      
      if (response.data.data.pagination) {
        setTotalPages(response.data.data.pagination.pages);
        setTotalItems(response.data.data.pagination.total);
      }
    } catch (error) {
      showError('Failed to fetch enrollments');
      console.error('Fetch enrollments error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEnrollments();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      enrolled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      unlocked: 'bg-purple-100 text-purple-800',
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-indigo-100 text-indigo-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A'}
      </span>
    );
  };

  const renderStudentRow = (enrollment) => {
    // Handle student data - could be an object or just an ID
    let studentName = 'Unknown Student';
    let studentEmail = 'No email';
    let studentMobile = 'No mobile';
    let studentInitial = 'U';
    
    if (typeof enrollment.student === 'object' && enrollment.student !== null) {
      // student is an object with student details
      studentName = enrollment.student.name || 'Unknown Student';
      studentEmail = enrollment.student.email || 'No email';
      studentMobile = enrollment.student.mobile || 'No mobile';
      studentInitial = enrollment.student.name?.charAt(0) || 'U';
    } else if (typeof enrollment.studentId === 'object' && enrollment.studentId !== null) {
      // studentId is an object with student details
      studentName = enrollment.studentId.name || 'Unknown Student';
      studentEmail = enrollment.studentId.email || 'No email';
      studentMobile = enrollment.studentId.mobile || 'No mobile';
      studentInitial = enrollment.studentId.name?.charAt(0) || 'U';
    } else if (typeof enrollment.studentId === 'string') {
      // studentId is just an ID
      if (enrollment.student) {
        studentName = enrollment.student.name || 'Unknown Student';
        studentEmail = enrollment.student.email || 'No email';
        studentMobile = enrollment.student.mobile || 'No mobile';
        studentInitial = enrollment.student.name?.charAt(0) || 'U';
      }
    }
    
    return (
      <tr key={enrollment._id} className="border-b border-gray-200 hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">
                {studentInitial}
              </div>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">{studentName}</div>
              <div className="text-sm text-gray-500">{studentEmail}</div>
              <div className="text-sm text-gray-500">{studentMobile}</div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900">
            {activeTab === 'courses' ? 'Course Enrollment' : 'Recording Unlock'}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          {getStatusBadge(activeTab === 'courses' ? enrollment.status : enrollment.status)}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {formatDate(enrollment.createdAt)}
        </td>
      </tr>
    );
  };

  // Removed pagination since we're fetching all data now

  const handleExport = async () => {
    try {
      setLoading(true);
      let endpoint = '';
      let filename = 'enrollments';
      let params = { format: 'csv' };
      
      if (!selectedCourse) {
        showError('Please select a course first');
        return;
      }

      if (activeTab === 'courses') {
        endpoint = `/enrollments/admin/courses/${selectedCourse}/export`;
        filename = `course-enrollments-${courses.find(c => c._id === selectedCourse)?.title || 'course'}`;
      } else {
        endpoint = `/enrollments/admin/recordings/${selectedCourse}/export`;
        filename = `recording-unlocks-${courses.find(c => c._id === selectedCourse)?.title || 'course'}`;
      }

      // Add search parameter if present
      if (searchTerm) {
        params.search = searchTerm;
      }

      // Create query string
      const queryString = new URLSearchParams(params).toString();
      const url = `${endpoint}?${queryString}`;
      
      const response = await api.get(url, { responseType: 'blob' });

      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      showSuccess('Export completed successfully');
    } catch (error) {
      console.error('Export error:', error);
      showError('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Enrollment Management</h1>
        <p className="mt-2 text-gray-600">Manage student enrollments course-wise (ordered by latest)</p>
      </div>

      {/* Course Selection */}
      <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="course-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Course
            </label>
            <select
              id="course-select"
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setCurrentPage(1);
              }}
              className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course._id} value={course._id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('courses')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'courses'
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Course Enrollments
              </button>
              <button
                onClick={() => setActiveTab('recordings')}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                  activeTab === 'recordings'
                    ? 'bg-primary-100 text-primary-700 border border-primary-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Video className="w-4 h-4 mr-2" />
                Recording Unlocks
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      {selectedCourse && (
        <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <form onSubmit={handleSearch} className="flex rounded-md shadow-sm">
                <div className="relative flex-grow focus-within:z-10">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by student name, email..."
                    className="block w-full rounded-none rounded-l-md border-0 py-1.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  />
                </div>
                <button
                  type="submit"
                  className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Search
                </button>
              </form>
            </div>
            
            
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : selectedCourse ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Enrolled Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeTab === 'courses' ? (
                    courseEnrollments.length > 0 ? (
                      courseEnrollments.map(renderStudentRow)
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                          No course enrollments found
                        </td>
                      </tr>
                    )
                  ) : recordingUnlocks.length > 0 ? (
                    recordingUnlocks.map(renderStudentRow)
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                        No recording unlocks found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No course selected</h3>
              <p className="mt-1 text-sm text-gray-500">
                Please select a course to view enrollments
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Enrollments;