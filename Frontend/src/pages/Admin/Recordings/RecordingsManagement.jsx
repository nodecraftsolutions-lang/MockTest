import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Video,
  Clock,
  Play,
  Image,
  BookOpen,
  BarChart3,
  Upload,
  Link,
  FileText,
  Eye,
  CheckCircle,
  AlertCircle,
  Search,
  Filter
} from "lucide-react";
import api from "../../../api/axios";
import { useToast } from "../../../context/ToastContext";

const RecordingsManagement = () => {
  const { showSuccess, showError } = useToast();
  const [courses, setCourses] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDuration, setFilterDuration] = useState("all");
  
  // Recording form state
  const [recordingForm, setRecordingForm] = useState({
    courseId: "",
    title: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    duration: ""
  });
  const [editingRecording, setEditingRecording] = useState(null);

  // Fetch all courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get("/courses");
        setCourses(res.data.data || []);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        showError("Failed to load courses");
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [showError]);

  // Fetch all recordings
  useEffect(() => {
    const fetchRecordings = async () => {
      setLoading(true);
      try {
        const res = await api.get("/recordings");
        setRecordings(res.data.data?.recordings || []);
      } catch (error) {
        console.error("Failed to fetch recordings:", error);
        showError("Failed to load recordings");
      } finally {
        setLoading(false);
      }
    };

    fetchRecordings();
  }, [showError]);

  // Handle recording form changes
  const handleRecordingChange = (field, value) => {
    setRecordingForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Reset recording form
  const resetRecordingForm = () => {
    setRecordingForm({
      courseId: selectedCourse || "",
      title: "",
      description: "",
      videoUrl: "",
      thumbnailUrl: "",
      duration: ""
    });
    setEditingRecording(null);
  };

  // Submit recording (create or update)
  const submitRecording = async () => {
    if (!recordingForm.courseId) {
      showError("Please select a course first");
      return;
    }

    if (!recordingForm.title || !recordingForm.videoUrl || !recordingForm.duration) {
      showError("Title, video URL, and duration are required");
      return;
    }

    setSubmitting(true);
    try {
      const recordingData = {
        ...recordingForm,
        duration: parseInt(recordingForm.duration)
      };

      if (editingRecording) {
        // Update existing recording
        await api.put(`/recordings/${editingRecording._id}`, recordingData);
        showSuccess("Recording updated successfully!");
      } else {
        // Create new recording
        await api.post("/recordings", recordingData);
        showSuccess("Recording uploaded successfully!");
      }

      // Refresh recordings list
      const recordingsRes = await api.get("/recordings");
      setRecordings(recordingsRes.data.data?.recordings || []);
      
      resetRecordingForm();
    } catch (error) {
      console.error("Recording operation failed:", error);
      showError(error.response?.data?.message || "Failed to save recording");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit recording
  const editRecording = (recording) => {
    setRecordingForm({
      courseId: recording.courseId,
      title: recording.title,
      description: recording.description || "",
      videoUrl: recording.videoUrl,
      thumbnailUrl: recording.thumbnailUrl || "",
      duration: recording.duration.toString()
    });
    setEditingRecording(recording);
  };

  // Delete recording
  const deleteRecording = async (recordingId) => {
    if (!window.confirm("Are you sure you want to delete this recording?")) {
      return;
    }

    try {
      await api.delete(`/recordings/${recordingId}`);
      showSuccess("Recording deleted successfully!");
      
      // Refresh recordings list
      const recordingsRes = await api.get("/recordings");
      setRecordings(recordingsRes.data.data?.recordings || []);
    } catch (error) {
      console.error("Delete recording failed:", error);
      showError(error.response?.data?.message || "Failed to delete recording");
    }
  };

  // Filter recordings based on search and filters
  const filteredRecordings = recordings.filter(recording => {
    const matchesSearch = recording.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recording.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = !selectedCourse || recording.courseId === selectedCourse;
    
    const matchesDuration = filterDuration === "all" || 
      (filterDuration === "short" && recording.duration <= 30) ||
      (filterDuration === "medium" && recording.duration > 30 && recording.duration <= 60) ||
      (filterDuration === "long" && recording.duration > 60);

    return matchesSearch && matchesCourse && matchesDuration;
  });

  // Calculate recording stats
  const recordingStats = {
    total: recordings.length,
    totalDuration: recordings.reduce((sum, recording) => sum + (recording.duration || 0), 0),
    averageDuration: recordings.length > 0 
      ? Math.round(recordings.reduce((sum, recording) => sum + (recording.duration || 0), 0) / recordings.length)
      : 0,
    byCourse: courses.reduce((acc, course) => {
      acc[course._id] = recordings.filter(r => r.courseId === course._id).length;
      return acc;
    }, {})
  };

  // Format duration for display
  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  // Get course name by ID
  const getCourseName = (courseId) => {
    const course = courses.find(c => c._id === courseId);
    return course ? course.title : "Unknown Course";
  };

  // Quick templates for common recording types
  const quickTemplates = [
    {
      title: "Aptitude Session",
      description: "Introduction to Aptitude problem-solving",
      duration: "35"
    },
    {
      title: "Technical Interview Prep",
      description: "Programming concepts and problem-solving techniques",
      duration: "45"
    },
    {
      title: "Communication Skills",
      description: "Verbal ability and professional communication",
      duration: "30"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Video className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Recordings Management
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload and manage video recordings across all courses
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Search and Filter Bar */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Search */}
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search recordings..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Course Filter */}
                <div>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Courses</option>
                    {courses.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Duration Filter */}
                <div>
                  <select
                    value={filterDuration}
                    onChange={(e) => setFilterDuration(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Durations</option>
                    <option value="short">Short (&lt;30 min)</option>
                    <option value="medium">Medium (30-60 min)</option>
                    <option value="long">Long (&gt;60 min)</option>
                  </select>
                </div>
              </div>

              {/* Results Count */}
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>
                  Showing {filteredRecordings.length} of {recordings.length} recordings
                </span>
                {(searchTerm || selectedCourse || filterDuration !== "all") && (
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCourse("");
                      setFilterDuration("all");
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>

            {/* Recording Upload Form */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Upload className="w-5 h-5 mr-2" />
                  {editingRecording ? 'Edit Recording' : 'Upload New Recording'}
                </h2>
              </div>
              <div className="p-6 space-y-6">
                  
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Course Selection */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Course *
                    </label>
                    <select
                      value={recordingForm.courseId}
                      onChange={(e) => handleRecordingChange("courseId", e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Choose a course...</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title} - {course.category}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Recording Title *
                    </label>
                    <input
                      type="text"
                      value={recordingForm.title}
                      onChange={(e) => handleRecordingChange("title", e.target.value)}
                      placeholder="e.g., Aptitude Session 3, Technical Interview Prep"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={recordingForm.description}
                      onChange={(e) => handleRecordingChange("description", e.target.value)}
                      placeholder="Recording description, topics covered, key takeaways..."
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Video URL */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Video URL *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={recordingForm.videoUrl}
                        onChange={(e) => handleRecordingChange("videoUrl", e.target.value)}
                        placeholder="https://res.cloudinary.com/.../video.mp4"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => {
                          handleRecordingChange("videoUrl", "https://res.cloudinary.com/dc3bi7giu/video/upload/v1758978830/MASTER_the_APTITUDE_Test_for_PLACEMENTS_FREE_Resources_Inside_-_Love_Babbar_360p_h264_goomn1.mp4");
                        }}
                        className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                      >
                        Example
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail URL */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Thumbnail URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={recordingForm.thumbnailUrl}
                        onChange={(e) => handleRecordingChange("thumbnailUrl", e.target.value)}
                        placeholder="https://res.cloudinary.com/.../image.jpg"
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          handleRecordingChange("thumbnailUrl", "https://res.cloudinary.com/demo/image/upload/aptitude-thumb.jpg");
                        }}
                        className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200"
                      >
                        Example
                      </button>
                    </div>
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      value={recordingForm.duration}
                      onChange={(e) => handleRecordingChange("duration", e.target.value)}
                      placeholder="35"
                      min="1"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Preview */}
                  {recordingForm.thumbnailUrl && (
                    <div className="flex items-center justify-center">
                      <div className="w-32 h-20 bg-gray-200 rounded-lg overflow-hidden border">
                        <img 
                          src={recordingForm.thumbnailUrl} 
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="hidden w-full h-full bg-gray-300 items-center justify-center">
                          <Image className="w-6 h-6 text-gray-500" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Templates */}
                <div className="border-t pt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Templates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {quickTemplates.map((template, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setRecordingForm(prev => ({
                            ...prev,
                            title: template.title,
                            description: template.description,
                            duration: template.duration
                          }));
                        }}
                        className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <div className="font-medium text-gray-900 text-sm mb-1">
                          {template.title}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {template.description}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                          {template.duration} min
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={submitRecording}
                    disabled={submitting}
                    className="flex items-center px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editingRecording ? 'Updating...' : 'Uploading...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {editingRecording ? 'Update Recording' : 'Upload Recording'}
                      </>
                    )}
                  </button>
                  
                  {(recordingForm.title || recordingForm.videoUrl || editingRecording) && (
                    <button
                      type="button"
                      onClick={resetRecordingForm}
                      className="flex items-center px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Recordings List */}
            {filteredRecordings.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <Play className="w-5 h-5 mr-2" />
                    All Recordings ({filteredRecordings.length})
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {filteredRecordings.map((recording) => (
                      <div 
                        key={recording._id} 
                        className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex gap-4">
                          {/* Thumbnail */}
                          <div className="flex-shrink-0 w-32 h-20 bg-gray-200 rounded-lg overflow-hidden border relative">
                            {recording.thumbnailUrl ? (
                              <img 
                                src={recording.thumbnailUrl} 
                                alt={recording.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                <Video className="w-6 h-6 text-gray-500" />
                              </div>
                            )}
                            <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                              {formatDuration(recording.duration)}
                            </div>
                          </div>

                          {/* Recording Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {recording.title}
                                </h3>
                                <p className="text-sm text-gray-600 mt-1">
                                  {getCourseName(recording.courseId)}
                                </p>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => editRecording(recording)}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteRecording(recording._id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {recording.description}
                            </p>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {formatDuration(recording.duration)}
                              </div>
                              <div className="flex items-center">
                                <Eye className="w-4 h-4 mr-1" />
                                {recording.views || 0} views
                              </div>
                              {recording.videoUrl && (
                                <a 
                                  href={recording.videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center text-blue-600 hover:text-blue-800"
                                >
                                  <Link className="w-4 h-4 mr-1" />
                                  Watch
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredRecordings.length === 0 && recordings.length === 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
                <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recordings Uploaded</h3>
                <p className="text-gray-600 mb-4">Start by uploading your first recording.</p>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload First Recording
                </button>
              </div>
            )}

            {/* No Results State */}
            {filteredRecordings.length === 0 && recordings.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
                <Search className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Matching Recordings</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search or filters.</p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCourse("");
                    setFilterDuration("all");
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Recording Stats */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                Recording Statistics
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <Video className="w-5 h-5 text-blue-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Total Recordings</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">{recordingStats.total}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Total Duration</span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {formatDuration(recordingStats.totalDuration)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center">
                    <Play className="w-5 h-5 text-purple-600 mr-3" />
                    <span className="text-sm font-medium text-gray-700">Average Length</span>
                  </div>
                  <span className="text-lg font-bold text-purple-600">
                    {formatDuration(recordingStats.averageDuration)}
                  </span>
                </div>
              </div>

              {/* Course Distribution */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">By Course</h4>
                <div className="space-y-2">
                  {courses.map((course) => (
                    recordingStats.byCourse[course._id] > 0 && (
                      <div key={course._id} className="flex justify-between text-sm">
                        <span className="text-gray-600 truncate">{course.title}</span>
                        <span className="font-semibold">{recordingStats.byCourse[course._id]}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="w-full flex items-center px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <Upload className="w-4 h-4 mr-3" />
                  Upload New Recording
                </button>
                
                <button
                  onClick={() => {
                    setRecordingForm({
                      courseId: "",
                      title: "Aptitude Session 3",
                      description: "Introduction to Aptitude problem-solving",
                      videoUrl: "https://res.cloudinary.com/dc3bi7giu/video/upload/v1758978830/MASTER_the_APTITUDE_Test_for_PLACEMENTS_FREE_Resources_Inside_-_Love_Babbar_360p_h264_goomn1.mp4",
                      thumbnailUrl: "https://res.cloudinary.com/demo/image/upload/aptitude-thumb.jpg",
                      duration: "35"
                    });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full flex items-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <FileText className="w-4 h-4 mr-3" />
                  Use Example Template
                </button>
              </div>
            </div>

            {/* Upload Tips */}
            <div className="bg-white rounded-2xl shadow-lg border border-yellow-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-yellow-500" />
                Upload Tips
              </h3>
              
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Use Cloudinary or similar services for video hosting</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Recommended video duration: 20-60 minutes</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Add descriptive titles and descriptions</span>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <span>Include thumbnails for better engagement</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecordingsManagement;