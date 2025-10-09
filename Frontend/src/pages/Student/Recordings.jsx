import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import { PlayCircle, Video, Clock, BookOpen } from "lucide-react";

const Recordings = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get("/courses?withRecordings=true"); 
      setCourses(res.data.data.courses || []);
    } catch (err) {
      console.error("Failed to fetch courses with recordings:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="large" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Recordings</h1>
        <div className="text-sm text-gray-500">
          {courses.length} {courses.length === 1 ? 'course' : 'courses'} available
        </div>
      </div>
      
      {courses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No recordings available yet</h3>
          <p className="text-gray-600 mb-6">Check back later for new content</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course._id}
              to={`/student/recordings/${course._id}`}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col"
            >
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <h2 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {course.title}
                  </h2>
                  <div className="flex-shrink-0 ml-2">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Video className="w-5 h-5 text-indigo-600" />
                    </div>
                  </div>
                </div>
                
                {course.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                    {course.description}
                  </p>
                )}
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {course.recordingsPrice === 0 ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Free
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      ₹{course.recordingsPrice}
                    </span>
                  )}
                  
                  {course.recordings && course.recordings.length > 0 && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      <Video className="w-3 h-3 mr-1" />
                      {course.recordings.length}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <div className="text-sm text-gray-500 flex items-center">
                  <BookOpen className="w-4 h-4 mr-1" />
                  Recordings
                </div>
                <PlayCircle className="w-5 h-5 text-indigo-600" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Recordings;