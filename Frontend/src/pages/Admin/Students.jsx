import { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, Eye, UserX, RefreshCw,
  Mail, Phone, Calendar, Activity,
  ChevronDown, ChevronUp, X, Check, AlertCircle, 
  UserCheck, FileText, CreditCard, TrendingUp,
  BookOpen, Video, GraduationCap, ShoppingCart
} from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { motion } from 'framer-motion';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchStudents();
  }, [filterStatus, sortBy, sortOrder]);

  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder);

      const response = await api.get(`/admin/students?${params.toString()}`);
      if (response.data.success) {
        setStudents(response.data.data.students);
      }
    } catch (error) {
      showError('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (studentId, currentStatus) => {
    try {
      const response = await api.put(`/admin/students/${studentId}/status`, {
        isActive: !currentStatus
      });
      
      if (response.data.success) {
        showSuccess(`Student ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchStudents();
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update student status');
    }
  };

  const handleResetPassword = async (studentId) => {
    if (window.confirm('Are you sure you want to reset this student\'s password?')) {
      try {
        const response = await api.post(`/admin/students/${studentId}/reset-password`);
        if (response.data.success) {
          showSuccess('Password reset successfully. Temporary password sent to student.');
        }
      } catch (error) {
        showError(error.response?.data?.message || 'Failed to reset password');
      }
    }
  };

  const viewStudentDetails = async (studentId) => {
    try {
      const response = await api.get(`/admin/students/${studentId}`);
      if (response.data.success) {
        setSelectedStudent(response.data.data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      showError('Failed to load student details');
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.mobile.includes(searchTerm);
    return matchesSearch;
  });

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="space-y-6">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Student Management</h1>
            <p className="text-indigo-100">View and manage student accounts</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Removed export and import buttons */}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {students.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Students</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {students.filter(s => s.isActive).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Attempts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {students.length > 0 
                  ? Math.round(students.reduce((sum, s) => sum + (s.attemptCount || 0), 0) / students.length)
                  : 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {students.reduce((sum, s) => sum + (s.orderCount || 0), 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
          >
            <Filter className="w-5 h-5" />
            <span>Filters</span>
            {showFilters ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {/* Expanded Filters */}
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)} 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              >
                <option value="all">All Students</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              >
                <option value="createdAt">Registration Date</option>
                <option value="name">Name</option>
                <option value="lastActiveAt">Last Active</option>
                <option value="attemptCount">Attempts</option>
                <option value="orderCount">Orders</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </motion.div>
        )}
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stats
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student, index) => (
                <motion.tr 
                  key={student._id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">ID: {student._id.slice(-8)}</div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center mb-1">
                        <Mail className="w-4 h-4 mr-1.5 text-gray-400" />
                        {student.email}
                      </div>
                      <div className="flex items-center">
                        <Phone className="w-4 h-4 mr-1.5 text-gray-400" />
                        {student.mobile}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex items-center mb-1">
                        <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                        {new Date(student.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Activity className="w-4 h-4 mr-1.5 text-gray-400" />
                        {student.lastActiveAt 
                          ? new Date(student.lastActiveAt).toLocaleDateString() 
                          : 'Never'}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center text-sm">
                        <FileText className="w-4 h-4 mr-1.5 text-gray-400" />
                        <span>{student.attemptCount || 0} attempts</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <CreditCard className="w-4 h-4 mr-1.5 text-gray-400" />
                        <span>{student.orderCount || 0} orders</span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      student.isActive 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {student.isActive ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <X className="w-3 h-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => viewStudentDetails(student._id)}
                        className="inline-flex items-center justify-center p-2 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleStatusToggle(student._id, student.isActive)}
                        className={`inline-flex items-center justify-center p-2 ${
                          student.isActive 
                            ? 'text-rose-600 hover:text-rose-900 hover:bg-rose-50' 
                            : 'text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50'
                        } rounded-lg transition-colors`}
                        title={student.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handleResetPassword(student._id)}
                        className="inline-flex items-center justify-center p-2 text-amber-600 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Reset Password"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Details Modal */}
      {showDetailsModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900">
                Student Profile - {selectedStudent.student.name}
              </h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedStudent(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Student Information */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col items-center mb-6">
                      <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                        <Users className="w-10 h-10 text-indigo-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{selectedStudent.student.name}</h3>
                      <p className="text-gray-600">Student ID: {selectedStudent.student._id.slice(-8)}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Mail className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{selectedStudent.student.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Phone className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Mobile</p>
                          <p className="font-medium">{selectedStudent.student.mobile || 'Not provided'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Joined</p>
                          <p className="font-medium">{new Date(selectedStudent.student.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <Activity className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm text-gray-500">Last Active</p>
                          <p className="font-medium">
                            {selectedStudent.student.lastActiveAt 
                              ? new Date(selectedStudent.student.lastActiveAt).toLocaleDateString()
                              : 'Never'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          selectedStudent.student.isActive 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {selectedStudent.student.isActive ? 'Active Account' : 'Inactive Account'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-blue-600 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900">Total Attempts</p>
                            <p className="text-sm text-gray-600">Test attempts</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{selectedStudent.statistics.totalAttempts}</p>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center">
                          <Check className="w-5 h-5 text-green-600 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900">Completed</p>
                            <p className="text-sm text-gray-600">Tests finished</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-green-600">{selectedStudent.statistics.completedAttempts}</p>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center">
                          <TrendingUp className="w-5 h-5 text-purple-600 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900">Avg Score</p>
                            <p className="text-sm text-gray-600">Percentage</p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold text-purple-600">{Math.round(selectedStudent.statistics.averageScore)}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity and Enrollments */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Enrollments Section */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <GraduationCap className="w-5 h-5 mr-2 text-indigo-600" />
                      Enrollments
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="p-3 bg-blue-50 rounded-lg text-center">
                        <BookOpen className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                        <p className="text-sm text-gray-600">Courses</p>
                        <p className="text-xl font-bold text-blue-600">{selectedStudent.courseEnrollments?.length || 0}</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg text-center">
                        <FileText className="w-6 h-6 text-green-600 mx-auto mb-1" />
                        <p className="text-sm text-gray-600">Tests</p>
                        <p className="text-xl font-bold text-green-600">{selectedStudent.testEnrollments?.length || 0}</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg text-center">
                        <Video className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                        <p className="text-sm text-gray-600">Recordings</p>
                        <p className="text-xl font-bold text-purple-600">{selectedStudent.recordingUnlocks?.length || 0}</p>
                      </div>
                    </div>
                    
                    {/* Course Enrollments */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <BookOpen className="w-4 h-4 mr-1 text-blue-600" />
                        Course Enrollments
                      </h4>
                      {selectedStudent.courseEnrollments && selectedStudent.courseEnrollments.length > 0 ? (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {selectedStudent.courseEnrollments.map((enrollment) => (
                            <div key={enrollment._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">{enrollment.courseId?.title}</span>
                              <span className="text-sm font-medium">₹{enrollment.courseId?.price || 0}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No course enrollments</p>
                      )}
                    </div>
                    
                    {/* Test Enrollments */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <FileText className="w-4 h-4 mr-1 text-green-600" />
                        Test Enrollments
                      </h4>
                      {selectedStudent.testEnrollments && selectedStudent.testEnrollments.length > 0 ? (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {selectedStudent.testEnrollments.map((enrollment) => (
                            <div key={enrollment._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">{enrollment.testId?.title}</span>
                              <span className="text-sm font-medium">₹{enrollment.testId?.price || 0}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No test enrollments</p>
                      )}
                    </div>
                    
                    {/* Recording Unlocks */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                        <Video className="w-4 h-4 mr-1 text-purple-600" />
                        Recording Unlocks
                      </h4>
                      {selectedStudent.recordingUnlocks && selectedStudent.recordingUnlocks.length > 0 ? (
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {selectedStudent.recordingUnlocks.map((unlock) => (
                            <div key={unlock._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm">{unlock.courseId?.title}</span>
                              <span className="text-sm font-medium">₹{unlock.courseId?.recordingsPrice || 0}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No recording unlocks</p>
                      )}
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                        Recent Test Attempts
                      </h3>
                      {selectedStudent.recentAttempts && selectedStudent.recentAttempts.length > 0 ? (
                        <div className="space-y-4">
                          {selectedStudent.recentAttempts.map((attempt) => (
                            <div key={attempt._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{attempt.testId?.title}</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(attempt.createdAt).toLocaleDateString()} at {new Date(attempt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <div className="text-right ml-4">
                                <p className="font-semibold text-gray-900">{attempt.score || 0}%</p>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                                  attempt.isPassed 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {attempt.isPassed ? 'Passed' : 'Failed'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600">No test attempts yet</p>
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <CreditCard className="w-5 h-5 mr-2 text-indigo-600" />
                        Recent Orders
                      </h3>
                      {selectedStudent.recentOrders && selectedStudent.recentOrders.length > 0 ? (
                        <div className="space-y-4">
                          {selectedStudent.recentOrders.map((order) => (
                            <div key={order._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              <div>
                                <p className="font-medium text-gray-900">Order #{order.orderId}</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">₹{order.totalAmount?.toLocaleString() || 0}</p>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                                  order.paymentStatus === 'completed' 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : order.paymentStatus === 'failed' 
                                      ? 'bg-rose-100 text-rose-800' 
                                      : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {order.paymentStatus}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="text-gray-600">No orders yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => handleResetPassword(selectedStudent.student._id)}
                  className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg font-medium transition-colors flex items-center justify-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset Password
                </button>
                <button
                  onClick={() => handleStatusToggle(selectedStudent.student._id, selectedStudent.student.isActive)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center ${
                    selectedStudent.student.isActive 
                      ? 'bg-rose-100 hover:bg-rose-200 text-rose-800' 
                      : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                  }`}
                >
                  <UserX className="w-4 h-4 mr-2" />
                  {selectedStudent.student.isActive ? 'Deactivate Account' : 'Activate Account'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Empty State */}
      {filteredStudents.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'No students have registered yet'
            }
          </p>
          {!(searchTerm || filterStatus !== 'all') && (
            <button 
              onClick={() => setShowFilters(true)}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageStudents;