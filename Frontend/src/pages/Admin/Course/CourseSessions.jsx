import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Calendar,
  Clock,
  Video,
  BookOpen,
  Users,
  Play,
  Link,
  FileText,
  BarChart3,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import api from "../../../api/axios";
import { useToast } from "../../../context/ToastContext";

const CourseSessions = () => {
  const { showSuccess, showError } = useToast();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courseDetails, setCourseDetails] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Session form state
  const [sessionForm, setSessionForm] = useState({
    title: "",
    startsAt: "",
    duration: "",
    streamLink: "",
    description: ""
  });
  const [editingSession, setEditingSession] = useState(null);

  // Fetch all courses
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const res = await api.get("/courses");
        setCourses(res.data.data || []); // ✅ Correct: response.data.data is the array
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        showError("Failed to load courses");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [showError]);

  // Fetch course details and sessions when course is selected
  useEffect(() => {
    const fetchCourseData = async () => {
      if (!selectedCourse) {
        setCourseDetails(null);
        setSessions([]);
        return;
      }

      setLoading(true);
      try {
        // Fetch course details - this endpoint exists based on your API response
        const courseRes = await api.get(`/courses/${selectedCourse}`);
        
        // ✅ Correct: response.data.data.course contains the course details
        // ✅ Correct: response.data.data.course.sessions contains the sessions
        const courseData = courseRes.data.data?.course;
        setCourseDetails(courseData);
        
        // Set sessions from the course data
        setSessions(courseData?.sessions || []);
        
      } catch (error) {
        console.error("Failed to fetch course details:", error);
        showError("Failed to load course data");
        setCourseDetails(null);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [selectedCourse, showError]);

  // Handle session form changes
  const handleSessionChange = (field, value) => {
    setSessionForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Reset session form
  const resetSessionForm = () => {
    setSessionForm({
      title: "",
      startsAt: "",
      duration: "",
      streamLink: "",
      description: ""
    });
    setEditingSession(null);
  };

  // Submit session (create or update)
  const submitSession = async () => {
    if (!selectedCourse) {
      showError("Please select a course first");
      return;
    }

    if (!sessionForm.title || !sessionForm.startsAt || !sessionForm.duration) {
      showError("Title, start time, and duration are required");
      return;
    }

    setSubmitting(true);
    try {
      if (editingSession) {
        // Update existing session
        await api.put(`/courses/${selectedCourse}/sessions/${editingSession._id}`, sessionForm);
        showSuccess("Session updated successfully!");
      } else {
        // Create new session
        await api.post(`/courses/${selectedCourse}/sessions`, sessionForm);
        showSuccess("Session created successfully!");
      }

      // Refresh course data to get updated sessions
      const courseRes = await api.get(`/courses/${selectedCourse}`);
      setCourseDetails(courseRes.data.data?.course);
      setSessions(courseRes.data.data?.course?.sessions || []);
      
      resetSessionForm();
    } catch (error) {
      console.error("Session operation failed:", error);
      showError(error.response?.data?.message || "Failed to save session");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit session
  const editSession = (session) => {
    setSessionForm({
      title: session.title,
      startsAt: session.startsAt.split('.')[0], // Remove milliseconds for datetime-local
      duration: session.duration,
      streamLink: session.streamLink || "",
      description: session.description || ""
    });
    setEditingSession(session);
  };

  // Delete session
  const deleteSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this session?")) {
      return;
    }

    try {
      await api.delete(`/courses/${selectedCourse}/sessions/${sessionId}`);
      showSuccess("Session deleted successfully!");
      
      // Refresh course data to get updated sessions
      const courseRes = await api.get(`/courses/${selectedCourse}`);
      setCourseDetails(courseRes.data.data?.course);
      setSessions(courseRes.data.data?.course?.sessions || []);
    } catch (error) {
      console.error("Delete session failed:", error);
      showError(error.response?.data?.message || "Failed to delete session");
    }
  };

  // Calculate session stats
  const sessionStats = {
    total: sessions.length,
    upcoming: sessions.filter(session => new Date(session.startsAt) > new Date()).length,
    completed: sessions.filter(session => new Date(session.startsAt) <= new Date()).length,
    totalDuration: sessions.reduce((sum, session) => sum + (session.duration || 0), 0)
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if session is upcoming
  const isUpcoming = (session) => {
    return new Date(session.startsAt) > new Date();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Video className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Course Sessions Management
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Schedule and manage live sessions for your courses
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Course Selection */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Select Course
                </h2>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Choose a Course to Manage Sessions
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={loading}
                  >
                    <option value="">
                      {loading ? "Loading courses..." : "Select a course..."}
                    </option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.title} - {course.category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Course Info */}
                {courseDetails && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h3 className="font-semibold text-blue-900 mb-2">{courseDetails.title}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                      <div>
                        <span className="font-medium">Category:</span>
                        <div>{courseDetails.category}</div>
                      </div>
                      <div>
                        <span className="font-medium">Level:</span>
                        <div>{courseDetails.level}</div>
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span>
                        <div>{courseDetails.duration} days</div>
                      </div>
                      <div>
                        <span className="font-medium">Sections:</span>
                        <div>{courseDetails.sections?.length || 0}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Session Creation Form */}
            {selectedCourse && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <Plus className="w-5 h-5 mr-2" />
                    {editingSession ? 'Edit Session' : 'Create New Session'}
                  </h2>
                </div>
                <div className="p-6 space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Title */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Session Title *
                      </label>
                      <input
                        type="text"
                        value={sessionForm.title}
                        onChange={(e) => handleSessionChange("title", e.target.value)}
                        placeholder="e.g., C2C Live Session, Week 1 Introduction"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Start Time */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Start Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={sessionForm.startsAt}
                        onChange={(e) => handleSessionChange("startsAt", e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Duration (minutes) *
                      </label>
                      <input
                        type="number"
                        value={sessionForm.duration}
                        onChange={(e) => handleSessionChange("duration", e.target.value)}
                        placeholder="60"
                        min="1"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Stream Link */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Stream Link
                      </label>
                      <input
                        type="url"
                        value={sessionForm.streamLink}
                        onChange={(e) => handleSessionChange("streamLink", e.target.value)}
                        placeholder="https://meet.google.com/abc-xyz"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={sessionForm.description}
                        onChange={(e) => handleSessionChange("description", e.target.value)}
                        placeholder="Session description, agenda, or important notes (supports all characters including emojis and symbols)..."
                        rows="5"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={submitSession}
                      disabled={submitting}
                      className="flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {editingSession ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {editingSession ? 'Update Session' : 'Create Session'}
                        </>
                      )}
                    </button>
                    
                    {(sessionForm.title || sessionForm.startsAt || editingSession) && (
                      <button
                        onClick={resetSessionForm}
                        className="flex items-center px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Sessions List */}
            {selectedCourse && sessions.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <Play className="w-5 h-5 mr-2" />
                    Scheduled Sessions ({sessions.length})
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {sessions.map((session) => (
                      <div 
                        key={session._id} 
                        className={`border rounded-xl p-4 transition-all ${
                          isUpcoming(session) 
                            ? 'border-green-200 bg-green-50 hover:shadow-md' 
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{session.title}</h3>
                              {isUpcoming(session) ? (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Upcoming
                                </span>
                              ) : (
                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Completed
                                </span>
                              )}
                            </div>
                            
                            <p className="text-xs text-gray-600 mb-2" style={{ whiteSpace: 'pre-line', fontWeight: 'normal' }} dangerouslySetInnerHTML={{ __html: session.description?.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-lg">$1</strong>') || '' }} />
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                                {formatDate(session.startsAt)}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-2 text-green-600" />
                                {session.duration} minutes
                              </div>
                              {session.streamLink && (
                                <div className="flex items-center">
                                  <Link className="w-4 h-4 mr-2 text-purple-600" />
                                  <a 
                                    href={session.streamLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 truncate"
                                  >
                                    Join Session
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2 ml-4">
                            <button
                              onClick={() => editSession(session)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteSession(session._id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {selectedCourse && sessions.length === 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
                <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sessions Scheduled</h3>
                <p className="text-gray-600 mb-4">Get started by creating your first session for this course.</p>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Session
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Session Stats */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                Session Statistics
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <Video className="w-5 h-5 text-blue-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Total Sessions</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{sessionStats.total}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Upcoming</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">{sessionStats.upcoming}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-gray-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Completed</span>
                  </div>
                  <span className="text-lg font-bold text-gray-600">{sessionStats.completed}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-purple-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Total Hours</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">
                    {(sessionStats.totalDuration / 60).toFixed(1)}h
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="w-full flex items-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-3" />
                  Create New Session
                </button>
                
                <button
                  onClick={() => {
                    setSessionForm({
                      title: "C2C Live Session",
                      startsAt: "",
                      duration: "60",
                      streamLink: "https://meet.google.com/abc-xyz",
                      description: "Introduction to Aptitude session"
                    });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full flex items-center px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <FileText className="w-4 h-4 mr-3" />
                  Use Template
                </button>
              </div>
            </div>

            {/* Upcoming Sessions */}
            {sessionStats.upcoming > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-yellow-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-yellow-500" />
                  Next Session
                </h3>
                
                <div className="space-y-3">
                  {sessions
                    .filter(session => isUpcoming(session))
                    .slice(0, 2)
                    .map((session) => (
                      <div key={session._id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h4 className="font-medium text-gray-900 text-sm mb-1">{session.title}</h4>
                        <div className="text-xs text-gray-600">
                          {formatDate(session.startsAt)}
                        </div>
                        {session.streamLink && (
                          <a 
                            href={session.streamLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center mt-2 text-xs text-blue-600 hover:text-blue-800"
                          >
                            <Link className="w-3 h-3 mr-1" />
                            Join Link
                          </a>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseSessions;