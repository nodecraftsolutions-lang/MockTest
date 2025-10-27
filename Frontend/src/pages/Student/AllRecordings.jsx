import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Video, Clock, Users, Play, Lock, Unlock, Search as SearchIcon, Filter } from "lucide-react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useToast } from "../../context/ToastContext";

const AllRecordings = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [courses, setCourses] = useState([]);
  const { showError } = useToast();

  useEffect(() => {
    fetchCourses();
    fetchRecordings();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses?withRecordings=true");
      setCourses(res.data.data.courses || []);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    }
  };

  const fetchRecordings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/recordings");
      if (res.data.success) {
        setRecordings(res.data.data.recordings || []);
      }
    } catch (err) {
      showError("Failed to load recordings");
      console.error("Failed to fetch recordings:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter recordings based on search term and selected course
  const filteredRecordings = recordings.filter(recording => {
    const matchesSearch = recording.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         recording.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCourse = selectedCourse ? recording.courseId?._id === selectedCourse : true;
    
    return matchesSearch && matchesCourse;
  });

  // Group recordings by course
  const recordingsByCourse = filteredRecordings.reduce((acc, recording) => {
    const courseId = recording.courseId?._id || "unknown";
    if (!acc[courseId]) {
      acc[courseId] = {
        course: recording.courseId,
        recordings: []
      };
    }
    acc[courseId].recordings.push(recording);
    return acc;
  }, {});

  if (loading) return <LoadingSpinner size="large" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Recordings</h1>
          <p className="text-gray-600 mt-2">
            Access all available recordings from your courses
          </p>
        </div>
        <div className="bg-primary-50 px-4 py-2 rounded-lg">
          <p className="text-primary-700 font-medium">
            {filteredRecordings.length} {filteredRecordings.length === 1 ? 'Recording' : 'Recordings'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search Recordings
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="search"
                placeholder="Search by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          {/* Course Filter */}
          <div>
            <label htmlFor="course-filter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Course
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="course-filter"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Recordings by Course */}
      {Object.keys(recordingsByCourse).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(recordingsByCourse).map(([courseId, courseData]) => (
            <div key={courseId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Course Header */}
              <div className="bg-gradient-to-r from-primary-50 to-indigo-50 px-6 py-5 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <Video className="w-6 h-6 text-primary-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {courseData.course?.title || "Unknown Course"}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {courseData.recordings.length} {courseData.recordings.length === 1 ? 'recording' : 'recordings'}
                      </p>
                    </div>
                  </div>
                  <Link 
                    to={`/student/recordings/${courseId}`}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200"
                  >
                    View Course <Play className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
              
              {/* Recordings Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courseData.recordings.map((recording) => (
                    <div 
                      key={recording._id} 
                      className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-primary-200"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1 text-lg">
                          {recording.title}
                        </h3>
                        <div className="flex-shrink-0 ml-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Video className="w-5 h-5 text-primary-600" />
                          </div>
                        </div>
                      </div>
                      
                      {recording.description && (
                        <p className="text-gray-600 mb-4 line-clamp-3 text-sm">
                          {recording.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                        {recording.duration && (
                          <span className="flex items-center bg-gray-100 px-2 py-1 rounded">
                            <Clock className="w-3 h-3 mr-1" />
                            {Math.floor(recording.duration / 60)}m {recording.duration % 60}s
                          </span>
                        )}
                        <span className="flex items-center bg-gray-100 px-2 py-1 rounded">
                          <Users className="w-3 h-3 mr-1" />
                          {recording.views || 0} views
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center">
                          {recording.isUnlocked ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Unlock className="w-3 h-3 mr-1" />
                              Unlocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <Lock className="w-3 h-3 mr-1" />
                              Locked
                            </span>
                          )}
                        </div>
                        <Link 
                          to={`/student/recordings/${courseId}?recording=${recording._id}`}
                          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors duration-200"
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Watch
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary-50">
            <Video className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mt-4 mb-2">
            No recordings available
          </h3>
          <p className="text-gray-600 max-w-md mx-auto mb-6">
            {searchTerm || selectedCourse 
              ? "No recordings match your search criteria. Try adjusting your filters." 
              : "There are currently no recordings available. Check back later for new content."}
          </p>
          {(searchTerm || selectedCourse) && (
            <button 
              onClick={() => {
                setSearchTerm("");
                setSelectedCourse("");
              }}
              className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors duration-200"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AllRecordings;