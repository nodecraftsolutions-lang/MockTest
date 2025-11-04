import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Clock, CheckCircle, ArrowRight } from "lucide-react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useToast } from "../../context/ToastContext";

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get("/courses");
      if (response.data.success) {
        setCourses(response.data.data || []); // ✅ fixed
      }
    } catch (error) {
      showError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="large" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Available Courses</h1>
          <p className="text-gray-600">
            Explore and enroll in courses to boost your skills.
          </p>
        </div>
      </div>

      {/* Courses Grid */}
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course._id}
              className="card flex flex-col justify-between hover:shadow-lg transition-shadow"
            >
              {/* Course Title */}
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {course.title}
                  </h3>
                </div>

                {/* Course Info */}
                <p className="text-xs text-gray-600 mb-4 line-clamp-3" style={{ fontWeight: 'normal' }} dangerouslySetInnerHTML={{ __html: course.description?.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-lg">$1</strong>') || '' }} />

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                  {course.duration && (
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1 text-primary-500" />
                      {course.duration} weeks
                    </span>
                  )}
                  <span className="flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                    {course.outcomes?.length || 0} Outcomes
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center mt-4">
                <span className="text-lg font-bold text-primary-600">
                  {course.price > 0 ? `₹${course.price}` : "Free"}
                </span>
                <Link
                  to={`/student/courses/${course._id}`}
                  className="btn-primary flex items-center"
                >
                  View Details <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No courses available yet
          </h3>
          <p className="text-gray-600">Please check back later.</p>
        </div>
      )}
    </div>
  );
};

export default Courses;
