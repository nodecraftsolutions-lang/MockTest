import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, Calendar, Clock, DollarSign } from "lucide-react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const res = await api.get(`/courses/${id}`);
      if (res.data.success) {
        setCourse(res.data.data.course);
        setIsEnrolled(res.data.data.isEnrolled);
      }
    } catch (err) {
      showError("Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      const res = await api.post(`/courses/${id}/enroll`);
      if (res.data.success) {
        showSuccess("Enrolled successfully");
        setIsEnrolled(true);
      }
    } catch {
      showError("Failed to enroll");
    }
  };

  if (loading) return <LoadingSpinner size="large" />;
  if (!course) return <div className="p-6 text-gray-600">Course not found.</div>;

  return (
    <div className="space-y-8 p-6">
      {/* Title & Description */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{course.title}</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">{course.description}</p>
      </div>

      {/* Outcomes */}
      {course.outcomes?.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">What you'll learn</h2>
          <ul className="space-y-2">
            {course.outcomes.map((o, idx) => (
              <li key={idx} className="flex items-center text-gray-700">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" /> {o}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Enroll Card */}
      <div className="card flex flex-col md:flex-row items-center justify-between p-6">
        <div className="space-y-2 text-gray-700">
          <div className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-green-600" />
            <span className="font-semibold">{course.price > 0 ? `₹${course.price}` : "Free"}</span>
          </div>
          {course.startDate && (
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-blue-600" />
              Starts on {new Date(course.startDate).toLocaleDateString()}
            </div>
          )}
          {course.durationWeeks && (
            <div className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-purple-600" />
              {course.durationWeeks} weeks
            </div>
          )}
        </div>

        <div>
          {!isEnrolled ? (
            <button
              onClick={handleEnroll}
              className="btn-primary px-6 py-3 mt-4 md:mt-0"
            >
              Enroll Now
            </button>
          ) : (
            <button
              onClick={() => navigate(`/student/courses/${id}/learn`)}
              className="btn-secondary px-6 py-3 mt-4 md:mt-0"
            >
              Continue Learning
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
