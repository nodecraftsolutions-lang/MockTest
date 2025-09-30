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
    // eslint-disable-next-line
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      const res = await api.get("/students/courses");
      if (res.data.success) {
        setCourses(res.data.data || []);
      }
    } catch (error) {
      showError("Failed to load enrolled courses");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="large" />;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-8 animate-fade-in">
      <div className="mb-4">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">
          My Courses
        </h1>
        <p className="text-gray-600 text-lg">
          All the courses you’re currently enrolled in
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-lg">
          <GraduationCap className="w-16 h-16 text-primary-400 mb-4 animate-bounce" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No enrolled courses yet
          </h3>
          <p className="text-gray-600 mb-6">
            Explore our catalog and enroll to start learning!
          </p>
          <Link to="/student/courses" className="btn-primary px-6 py-2 rounded-full shadow hover:scale-105 transition">
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course, idx) => (
            <div
              key={course._id}
              className="bg-gradient-to-br from-primary-50 to-white border border-primary-100 rounded-2xl shadow-md hover:shadow-xl transition hover:scale-[1.03] duration-200 flex flex-col h-full animate-fade-in"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="p-6 flex flex-col flex-1">
                <h2 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                  {course.title}
                </h2>
                <p className="text-gray-600 line-clamp-2 mb-4 flex-1">
                  {course.description}
                </p>
                <div className="flex items-center text-sm text-gray-500 mb-2 gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    Duration: <span className="font-medium text-gray-700">{course.duration || "N/A"} weeks</span>
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-500 mb-6 gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Start Date:{" "}
                    <span className="font-medium text-gray-700">
                      {course.startDate
                        ? new Date(course.startDate).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </span>
                </div>
                <Link
                  to={`/student/courses/${course._id}`}
                  className="btn-primary w-full text-center py-2 rounded-full shadow hover:scale-105 transition font-semibold"
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