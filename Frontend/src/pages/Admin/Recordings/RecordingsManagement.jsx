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
  Filter,
  Calendar,
  User,
  RefreshCw
} from "lucide-react";
import api from "../../../api/axios";
import { useToast } from "../../../context/ToastContext";

const RecordingsManagement = () => {
  const { showSuccess, showError } = useToast();
  const [courses, setCourses] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDuration, setFilterDuration] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0,
    hasNext: false,
    hasPrev: false
  });
  
  // Recording form state
  const [recordingForm, setRecordingForm] = useState({
    courseId: "",
    title: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    duration: "",
    resources: [
      { title: "", link: "" }
    ]
  });
  const [editingRecording, setEditingRecording] = useState(null);

  // Fetch all courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        // Fetch courses with more detailed information
        const res = await api.get("/courses");
        const coursesData = res.data.data || [];
        
        // Debug: Log courses data
        console.log("Fetched courses:", coursesData);
        
        setCourses(coursesData);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
        showError("Failed to load courses");
        setCourses([]);
      }
    };

    fetchCourses();
  }, [showError]);

  // Fetch all recordings
  useEffect(() => {
    // Only fetch recordings if courses are loaded
    if (courses.length === 0) return;
    
    const fetchRecordings = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/recordings?page=${pagination.current}&limit=10&sortBy=${sortBy}&sortOrder=${sortOrder}${selectedCourse ? `&courseId=${selectedCourse}` : ''}${searchTerm ? `&search=${searchTerm}` : ''}`);
        const recordingsData = res.data.data?.recordings || [];
        const paginationData = res.data.data?.pagination || {};
        
        // Debug: Log recordings data to see structure
        console.log("Recordings data:", recordingsData);
        console.log("Courses data:", courses);
        console.log("Pagination data:", paginationData);
        
        setRecordings(recordingsData);
        setPagination(paginationData);
      } catch (error) {
        console.error("Failed to fetch recordings:", error);
        showError("Failed to load recordings");
      } finally {
        setLoading(false);
      }
    };

    fetchRecordings();
  }, [showError, sortBy, sortOrder, courses, pagination.current, selectedCourse, searchTerm, filterDuration]);

  // Handle recording form changes
  const handleRecordingChange = (field, value) => {
    setRecordingForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle resource changes
  const handleResourceChange = (index, field, value) => {
    const updatedResources = [...recordingForm.resources];
    updatedResources[index][field] = value;
    setRecordingForm(prev => ({
      ...prev,
      resources: updatedResources
    }));
  };

  // Add a new resource field
  const addResource = () => {
    setRecordingForm(prev => ({
      ...prev,
      resources: [...prev.resources, { title: "", link: "" }]
    }));
  };

  // Remove a resource field
  const removeResource = (index) => {
    if (recordingForm.resources.length > 1) {
      const updatedResources = [...recordingForm.resources];
      updatedResources.splice(index, 1);
      setRecordingForm(prev => ({
        ...prev,
        resources: updatedResources
      }));
    }
  };

  // Reset resources to default
  const resetResources = () => {
    setRecordingForm(prev => ({
      ...prev,
      resources: [{ title: "", link: "" }]
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
      duration: "",
      resources: [
        { title: "", link: "" }
      ]
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
      // Filter out empty resources
      const filteredResources = recordingForm.resources.filter(resource => 
        resource.title.trim() !== "" && resource.link.trim() !== ""
      );
      
      const recordingData = {
        ...recordingForm,
        duration: parseInt(recordingForm.duration),
        resources: filteredResources
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
      try {
        const recordingsRes = await api.get(`/recordings?page=${pagination.current}&limit=10&sortBy=${sortBy}&sortOrder=${sortOrder}${selectedCourse ? `&courseId=${selectedCourse}` : ''}${searchTerm ? `&search=${searchTerm}` : ''}`);
        const recordingsData = recordingsRes.data.data?.recordings || [];
        const paginationData = recordingsRes.data.data?.pagination || {};
        setRecordings(recordingsData);
        setPagination(paginationData);
      } catch (refreshError) {
        console.error("Failed to refresh recordings after submission:", refreshError);
        // Still show success message even if refresh fails
      }
      
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
    // Extract courseId properly from either string or object format
    const courseId = recording.courseId && typeof recording.courseId === 'object' ? 
      recording.courseId._id : 
      recording.courseId;
      
    setRecordingForm({
      courseId: courseId || "",
      title: recording.title,
      description: recording.description || "",
      videoUrl: recording.videoUrl,
      thumbnailUrl: recording.thumbnailUrl || "",
      duration: recording.duration.toString(),
      resources: recording.resources && recording.resources.length > 0 
        ? recording.resources 
        : [{ title: "", link: "" }]
    });
    setEditingRecording(recording);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      try {
        const recordingsRes = await api.get(`/recordings?page=${pagination.current}&limit=10&sortBy=${sortBy}&sortOrder=${sortOrder}${selectedCourse ? `&courseId=${selectedCourse}` : ''}${searchTerm ? `&search=${searchTerm}` : ''}`);
        const recordingsData = recordingsRes.data.data?.recordings || [];
        const paginationData = recordingsRes.data.data?.pagination || {};
        setRecordings(recordingsData);
        setPagination(paginationData);
      } catch (refreshError) {
        console.error("Failed to refresh recordings after deletion:", refreshError);
        // Still show success message even if refresh fails
      }
    } catch (error) {
      console.error("Delete recording failed:", error);
      showError(error.response?.data?.message || "Failed to delete recording");
    }
  };

  // Filter recordings based on search and filters
  const filteredRecordings = recordings.filter(recording => {
    const matchesSearch = recording.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recording.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = !selectedCourse || 
                         (recording.courseId && typeof recording.courseId === 'string' && recording.courseId === selectedCourse) || 
                         (recording.courseId && typeof recording.courseId === 'object' && recording.courseId._id === selectedCourse);
    
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
      acc[course._id] = recordings.filter(r => {
        // Handle both string and object courseId formats
        const recordingCourseId = r.courseId && typeof r.courseId === 'object' ? r.courseId._id : r.courseId;
        return recordingCourseId === course._id;
      }).length;
      return acc;
    }, {})
  };

  // Format duration for display
  const formatDuration = (minutes) => {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
  };

  // Get course name by ID - improved to handle populated data
  const getCourseName = (courseId) => {
    // Handle both populated and non-populated courseId
    const id = courseId && typeof courseId === 'object' && courseId._id ? 
      courseId._id : 
      (typeof courseId === 'string' ? courseId : null);
    
    if (!id) return "Unknown Course";
    
    const course = courses.find(c => c._id === id);
    
    return course ? course.title : "Unknown Course";
  };

  // Get course category - improved to handle populated data
  const getCourseCategory = (courseId) => {
    // Handle both populated and non-populated courseId
    const id = courseId && typeof courseId === 'object' && courseId._id ? 
      courseId._id : 
      (typeof courseId === 'string' ? courseId : null);
    
    if (!id) return "";
    
    const course = courses.find(c => c._id === id);
    return course ? course.category : "";
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

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

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
            


            {/* Loading indicator */}
            {loading && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
                <p className="text-gray-600">Loading recordings...</p>
              </div>
            )}

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

                {/* Resources Section */}
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Resources</h3>
                    <button
                      type="button"
                      onClick={addResource}
                      className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Resource
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {recordingForm.resources.map((resource, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={resource.title}
                            onChange={(e) => handleResourceChange(index, 'title', e.target.value)}
                            placeholder="Resource title (e.g., Lecture Notes, Practice Problems)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            type="url"
                            value={resource.link}
                            onChange={(e) => handleResourceChange(index, 'link', e.target.value)}
                            placeholder="Resource link (e.g., Google Drive, PDF)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </div>
                        {recordingForm.resources.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeResource(index)}
                            className="p-2 text-red-600 hover:text-red-800"
                            title="Remove resource"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {recordingForm.resources.length > 1 && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={resetResources}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Reset resources
                      </button>
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
                        className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-5 transition-colors"
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

            {/* Recordings List - Improved View */}
            {filteredRecordings.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                  <h2 className="text-xl font-semibold text-white flex items-center">
                    <Play className="w-5 h-5 mr-2" />
                    All Recordings
                  </h2>
                  <p className="text-emerald-100 text-sm mt-1">
                    Showing {filteredRecordings.length} of {recordings.length} recordings
                  </p>
                </div>
                <div className="p-6">
                  {/* Filters for recordings list */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-sm font-semibold text-gray-700">Filter Recordings</h3>
                      <div className="hidden md:flex gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const res = await api.get(`/recordings?page=${pagination.current}&limit=10&sortBy=${sortBy}&sortOrder=${sortOrder}${selectedCourse ? `&courseId=${selectedCourse}` : ''}${searchTerm ? `&search=${searchTerm}` : ''}`);
                              const recordingsData = res.data.data?.recordings || [];
                              const paginationData = res.data.data?.pagination || {};
                              setRecordings(recordingsData);
                              setPagination(paginationData);
                              showSuccess("Recordings refreshed successfully");
                            } catch (error) {
                              console.error("Failed to refresh recordings:", error);
                              showError("Failed to refresh recordings");
                            }
                          }}
                          className="text-xs text-green-600 hover:text-green-800 flex items-center px-2 py-1 bg-white border border-green-200 rounded-lg"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Refresh
                        </button>
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setSelectedCourse("");
                            setFilterDuration("all");
                            setSortBy("createdAt");
                            setSortOrder("desc");
                            // Reset to first page when clearing filters
                            setPagination(prev => ({ ...prev, current: 1 }));
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 flex items-center px-2 py-1 bg-white border border-blue-200 rounded-lg"
                        >
                          <X className="w-3 h-3 mr-1" />
                          Clear All
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                      {/* Search within recordings list */}
                      <div className="relative md:col-span-4">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by title or description..."
                          value={searchTerm}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            // Reset to first page when search term changes
                            setPagination(prev => ({ ...prev, current: 1 }));
                          }}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        />
                      </div>
                      
                      {/* Course filter for recordings list */}
                      <div className="md:col-span-3">
                        <select
                          value={selectedCourse}
                          onChange={(e) => {
                            setSelectedCourse(e.target.value);
                            // Reset to first page when course filter changes
                            setPagination(prev => ({ ...prev, current: 1 }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                        >
                          <option value="">All Courses</option>
                          {courses.map((course) => (
                            <option key={course._id} value={course._id}>
                              {course.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Duration filter for recordings list */}
                      <div className="md:col-span-2">
                        <select
                          value={filterDuration}
                          onChange={(e) => {
                            setFilterDuration(e.target.value);
                            // Reset to first page when duration filter changes
                            setPagination(prev => ({ ...prev, current: 1 }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                        >
                          <option value="all">All Durations</option>
                          <option value="short">Short (&lt;30 min)</option>
                          <option value="medium">Medium (30-60 min)</option>
                          <option value="long">Long (&gt;60 min)</option>
                        </select>
                      </div>
                      
                      {/* Sort options for recordings list */}
                      <div className="md:col-span-3">
                        <div className="flex gap-2">
                          <select
                            value={sortBy}
                            onChange={(e) => {
                              setSortBy(e.target.value);
                              // Reset to first page when sort changes
                              setPagination(prev => ({ ...prev, current: 1 }));
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                          >
                            <option value="createdAt">Upload Date</option>
                            <option value="title">Title</option>
                            <option value="duration">Duration</option>
                          </select>
                          <select
                            value={sortOrder}
                            onChange={(e) => {
                              setSortOrder(e.target.value);
                              // Reset to first page when sort order changes
                              setPagination(prev => ({ ...prev, current: 1 }));
                            }}
                            className="w-20 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                          >
                            <option value="desc">Desc</option>
                            <option value="asc">Asc</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    {/* Responsive filter controls for smaller screens */}
                    <div className="md:hidden mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={async () => {
                          try {
                            const res = await api.get(`/recordings?page=${pagination.current}&limit=10&sortBy=${sortBy}&sortOrder=${sortOrder}${selectedCourse ? `&courseId=${selectedCourse}` : ''}${searchTerm ? `&search=${searchTerm}` : ''}`);
                            const recordingsData = res.data.data?.recordings || [];
                            const paginationData = res.data.data?.pagination || {};
                            setRecordings(recordingsData);
                            setPagination(paginationData);
                            showSuccess("Recordings refreshed successfully");
                          } catch (error) {
                            console.error("Failed to refresh recordings:", error);
                            showError("Failed to refresh recordings");
                          }
                        }}
                        className="text-xs text-green-600 hover:text-green-800 flex items-center px-2 py-1 border border-green-200 rounded"
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Refresh
                      </button>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setSelectedCourse("");
                          setFilterDuration("all");
                          setSortBy("createdAt");
                          setSortOrder("desc");
                          // Reset to first page when clearing filters
                          setPagination(prev => ({ ...prev, current: 1 }));
                        }}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center px-2 py-1 border border-blue-200 rounded"
                      >
                        <X className="w-3 h-3 mr-1" />
                        Clear All
                      </button>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {filteredRecordings.map((recording) => (
                      <div 
                        key={recording._id} 
                        className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row gap-4">
                          {/* Thumbnail */}
                          <div className="flex-shrink-0 w-full md:w-48 h-32 bg-gray-200 rounded-lg overflow-hidden border relative">
                            {recording.thumbnailUrl ? (
                              <img 
                                src={recording.thumbnailUrl} 
                                alt={recording.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                <Video className="w-8 h-8 text-gray-500" />
                              </div>
                            )}
                            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                              {formatDuration(recording.duration)}
                            </div>
                          </div>

                          {/* Recording Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h3 className="font-semibold text-gray-900 text-lg">
                                  {recording.title}
                                </h3>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                    {getCourseName(recording.courseId)}
                                  </span>
                                  <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                    {getCourseCategory(recording.courseId)}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <button
                                  onClick={() => editRecording(recording)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                  title="Edit recording"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteRecording(recording._id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Delete recording"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {recording.description}
                            </p>
                            
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {formatDate(recording.createdAt)}
                              </div>
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
                                  <Play className="w-4 h-4 mr-1" />
                                  Watch
                                </a>
                              )}
                            </div>
                            
                            {/* Resources Preview */}
                            {recording.resources && recording.resources.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <div className="flex flex-wrap gap-2">
                                  {recording.resources.slice(0, 3).map((resource, index) => (
                                    <a
                                      key={index}
                                      href={resource.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
                                    >
                                      <FileText className="w-3 h-3 mr-1" />
                                      {resource.title}
                                    </a>
                                  ))}
                                  {recording.resources.length > 3 && (
                                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                      +{recording.resources.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="mt-6 flex justify-center">
                      <nav className="flex items-center gap-2">
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, current: Math.max(1, prev.current - 1) }))}
                          disabled={!pagination.hasPrev}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                      
                        {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                          let pageNum;
                          if (pagination.pages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.current <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.current >= pagination.pages - 2) {
                            pageNum = pagination.pages - 4 + i;
                          } else {
                            pageNum = pagination.current - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPagination(prev => ({ ...prev, current: pageNum }))}
                              className={`px-3 py-1 text-sm border rounded-lg ${
                                pagination.current === pageNum
                                  ? 'bg-blue-500 text-white border-blue-500'
                                  : 'border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      
                        <button
                          onClick={() => setPagination(prev => ({ ...prev, current: Math.min(prev.pages, prev.current + 1) }))}
                          disabled={!pagination.hasNext}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      
                        <button
                          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 ml-4"
                        >
                          Back to Top
                        </button>
                      </nav>
                    </div>
                  )}
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