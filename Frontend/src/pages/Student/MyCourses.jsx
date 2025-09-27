import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Calendar, GraduationCap } from "lucide-react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useToast } from "../../context/ToastContext";

const MyCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
  try {
    const res = await api.get("/students/courses");
    if (res.data.success) {
      setCourses(res.data.data || []); // ✅ not res.data.data.courses
    }
  } catch (error) {
    showError("Failed to load enrolled courses");
  } finally {
    setLoading(false);
  }
};


  if (loading) return <LoadingSpinner size="large" />;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <p className="text-gray-600">Courses you are currently enrolled in</p>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No enrolled courses yet
          </h3>
          <p className="text-gray-600 mb-4">
            Explore courses and enroll to start learning.
          </p>
          <Link to="/student/courses" className="btn-primary">
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course._id}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="p-5">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {course.title}
                </h2>
                <p className="text-gray-600 line-clamp-2 mb-4">
                  {course.description}
                </p>

                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Clock className="w-4 h-4 mr-1" />
                  Duration: {course.duration || "N/A"} weeks
                </div>

                <div className="flex items-center text-sm text-gray-500 mb-4">
                  <Calendar className="w-4 h-4 mr-1" />
                  Start Date:{" "}
                  {course.startDate
                    ? new Date(course.startDate).toLocaleDateString()
                    : "N/A"}
                </div>

                <Link
                  to={`/student/courses/${course._id}`}
                  className="btn-primary w-full text-center"
                >
                  Continue
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;
