import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  GraduationCap,
  Clock,
  CheckCircle,
  ListChecks,
  Calendar,
  Video,
} from "lucide-react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useToast } from "../../context/ToastContext";

const CourseDetails = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const response = await api.get(`/courses/${id}`);
      if (response.data.success) {
        setCourse(response.data.data.course);
      }
    } catch (error) {
      showError("Failed to load course details");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);

      if (course.price > 0) {
        // Paid course -> Payment
        const response = await api.post("/payments/create-course-order", {
          courseId: course._id,
        });

        if (response.data.success) {
          const { razorpayOrder, razorpayKeyId } = response.data.data;

          const options = {
            key: razorpayKeyId,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: "MockTest Pro",
            description: course.title,
            order_id: razorpayOrder.id,
            handler: async (paymentRes) => {
              try {
                const verify = await api.post("/payments/verify-course", {
                  razorpay_order_id: paymentRes.razorpay_order_id,
                  razorpay_payment_id: paymentRes.razorpay_payment_id,
                  razorpay_signature: paymentRes.razorpay_signature,
                  courseId: course._id,
                });

                if (verify.data.success) {
                  showSuccess("Enrollment successful! 🎉");
                  fetchCourse();
                }
              } catch {
                showError("Payment verification failed");
              }
            },
            prefill: {
              name: "Student Name",
              email: "student@example.com",
              contact: "9999999999",
            },
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        }
      } else {
        // Free course
        const response = await api.post("/students/enroll-course", {
          courseId: course._id,
        });

        if (response.data.success) {
          showSuccess("Enrolled successfully in free course!");
          fetchCourse();
        }
      }
    } catch (error) {
      showError("Enrollment failed");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <LoadingSpinner size="large" />;

  if (!course)
    return (
      <div className="text-center py-12">
        <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Course not found
        </h3>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-14 h-14 bg-primary-100 rounded-lg flex items-center justify-center">
          <GraduationCap className="w-7 h-7 text-primary-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-gray-600">{course.description}</p>
        </div>
      </div>

      {/* Course Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 bg-blue-50 rounded-lg flex items-center space-x-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <span>{course.duration}</span>
        </div>
        <div className="p-4 bg-green-50 rounded-lg flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-green-600" />
          <span>{course.schedule}</span>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-purple-600" />
          <span>{course.outcomes?.length || 0} Outcomes</span>
        </div>
      </div>

      {/* Outcomes */}
      {course.outcomes?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            What you’ll learn
          </h3>
          <ul className="space-y-2 text-gray-700">
            {course.outcomes.map((o, i) => (
              <li key={i} className="flex items-center">
                <CheckCircle className="w-4 h-4 text-primary-500 mr-2" />
                {o}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Live Classes */}
      {course.liveClasses?.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Live Classes
          </h3>
          <ul className="space-y-2 text-gray-700">
            {course.liveClasses.map((lc, i) => (
              <li key={i} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Video className="w-4 h-4 text-red-500" />
                  <span>{lc.title}</span>
                </div>
                <a
                  href={lc.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline text-sm"
                >
                  Join
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Enroll Button */}
      <div>
        {course.isEnrolled ? (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            ✅ You are already enrolled in this course.
          </div>
        ) : (
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="btn-primary px-6 py-3"
          >
            {enrolling
              ? "Processing..."
              : course.price > 0
              ? `Enroll Now (₹${course.price})`
              : "Enroll for Free"}
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseDetails;
