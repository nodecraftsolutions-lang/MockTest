import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Clock, Calendar, CheckCircle } from "lucide-react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useToast } from "../../context/ToastContext";

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      const response = await api.get("/students/courses");
      if (response.data.success) {
        setCourses(response.data.data.courses);
      }
    } catch (error) {
      showError("Failed to load your courses");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="large" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <p className="text-gray-600">Here are the courses you're enrolled in</p>
      </div>

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Link
            to={`/student/courses/${course._id}`}
            key={course._id}
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-600">{course.category}</p>
              </div>
            </div>

            <p className="text-gray-700 mb-4 line-clamp-2">
              {course.description}
            </p>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>{course.duration}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-green-500" />
                <span>{course.schedule}</span>
              </span>
              <span className="flex items-center space-x-1">
                <CheckCircle className="w-4 h-4 text-purple-500" />
                <span>{course.outcomes?.length || 0} Outcomes</span>
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {courses.length === 0 && (
        <div className="text-center py-12">
          <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Courses Found
          </h3>
          <p className="text-gray-600 mb-4">
            You have not enrolled in any courses yet.
          </p>
          <Link to="/student/courses" className="btn-primary">
            Browse Courses
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyCourses;