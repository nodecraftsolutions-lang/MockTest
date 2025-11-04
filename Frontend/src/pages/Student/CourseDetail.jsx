import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  CheckCircle, Calendar, Clock, DollarSign, User, 
  BookOpen, Award, Users, List, Target, Star,
  Play, Bookmark, Share2, ArrowRight, ChevronRight,
  BarChart3, Languages, Clock4, BadgeCheck
} from "lucide-react";
import { motion } from "framer-motion";
import api from "../../api/axios";
import axios from "axios";
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
  const [activeTab, setActiveTab] = useState("overview");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    name: "",
    email: "",
    mobile: ""
  });

  useEffect(() => {
    fetchCourse();
    // Initialize billing details with user info
    if (user) {
      setBillingDetails({
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || ""
      });
    }
    window.scrollTo(0, 0);
  }, [id, user]);

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

  // Function to send enrollment email
  const sendEnrollmentEmail = async (userName, userEmail, courseTitle) => {
    try {
      await axios.post("https://prep-zone-mailserver.vercel.app/api/mail/enroll", {
        name: userName,
        email: userEmail,
        courseTitle: courseTitle
      });
      console.log("📧 Enrollment email sent successfully");
    } catch (mailError) {
      console.error("❌ Error sending enrollment email:", mailError);
    }
  };

  const handleEnroll = async () => {
    try {
      // ✅ For paid courses, open payment modal
      if (course.isPaid && course.price > 0) {
        setShowPaymentModal(true);
      } else {
        // ✅ For free courses, enroll directly
        const res = await api.post(`/courses/${id}/enroll`);
        if (res.data.success) {
          showSuccess("Enrolled successfully");
          setIsEnrolled(true);

          // ✅ Send enrollment email
          await sendEnrollmentEmail(
            user?.name || "User", 
            user?.email || "no-reply@example.com", 
            course?.title || "Unknown Course"
          );
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to enroll";
      showError(errorMessage);
    }
  };

  const handlePayment = async () => {
    try {
      console.log('Initiating payment for course:', id);
      
      // Validate course ID
      if (!id) {
        showError("Invalid course ID");
        return;
      }

      // Validate billing details
      if (!billingDetails.name || !billingDetails.email || !billingDetails.mobile) {
        showError("Please fill all billing details");
        return;
      }

      // Validate mobile number format
      if (!/^[0-9]{10}$/.test(billingDetails.mobile)) {
        showError("Please enter a valid 10-digit mobile number");
        return;
      }

      // Validate email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingDetails.email)) {
        showError("Please enter a valid email address");
        return;
      }

      // Show loading state
      console.log('Creating order with data:', { courseId: id, billingDetails });

      // Create order
      const orderRes = await api.post("/payments/create-course-order", {
        courseId: id,
        billingDetails
      });

      console.log('Order creation response:', orderRes.data);

      if (orderRes.data.success) {
        const { razorpayOrder, razorpayKeyId } = orderRes.data.data;
        console.log('Razorpay order details:', razorpayOrder);

        // Load Razorpay script
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);

        script.onload = () => {
          const options = {
            key: razorpayKeyId,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: "PrepZon",
            description: course.title,
            order_id: razorpayOrder.id,
            handler: async function (response) {
              try {
                console.log('Payment response:', response);
                // Verify payment
                const verifyRes = await api.post("/payments/verify-course-payment", {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                });

                console.log('Verification response:', verifyRes.data);

                if (verifyRes.data.success) {
                  showSuccess("Payment successful! You are now enrolled.");
                  setIsEnrolled(true);
                  setShowPaymentModal(false);
                  
                  // ✅ Send enrollment email after successful payment
                  await sendEnrollmentEmail(
                    billingDetails.name || user?.name || "User", 
                    billingDetails.email || user?.email || "no-reply@example.com", 
                    course?.title || "Unknown Course"
                  );
                } else {
                  showError("Payment verification failed: " + (verifyRes.data.message || "Unknown error"));
                }
              } catch (verifyError) {
                console.error("Payment verification error:", verifyError);
                showError("Payment verification failed. Please contact support.");
              }
            },
            prefill: {
              name: billingDetails.name,
              email: billingDetails.email,
              contact: billingDetails.mobile
            },
            theme: {
              color: "#3B82F6"
            },
            modal: {
              ondismiss: function() {
                showError("Payment cancelled");
              }
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.open();
        };

        script.onerror = () => {
          showError("Failed to load payment gateway. Please try again.");
        };
      }
    } catch (error) {
      console.error("Payment error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to initiate payment";
      showError(errorMessage);
    }
  };

  const defaultAvatar = "https://ui-avatars.com/api/?background=random&color=fff&bold=true&name=";

  if (loading) return (
    <div className="flex justify-center items-center h-[60vh]">
      <LoadingSpinner size="large" />
    </div>
  );
  
  if (!course) return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="p-6 text-center text-gray-600 h-[60vh] flex flex-col items-center justify-center"
    >
      <h2 className="text-2xl font-bold mb-2">Course not found</h2>
      <p>The course you're looking for doesn't exist or has been removed.</p>
      <button 
        onClick={() => navigate('/student/courses')}
        className="mt-4 btn-secondary"
      >
        Browse Courses
      </button>
    </motion.div>
  );

  // Enhanced course data with additional details
  const enhancedCourse = {
    ...course,
    rating: course.rating || 4.8,
    students: course.students || 1250,
    level: course.level || "Intermediate",
    language: course.language || "English",
    lastUpdated: course.lastUpdated || new Date().toISOString(),
    certificate: course.certificate !== false,
    lifetimeAccess: course.lifetimeAccess !== false,
  };

  const descriptionLines = course.description ? course.description.split('\n').filter(line => line.trim()) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white overflow-hidden"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-36 translate-x-36"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full translate-y-48 -translate-x-48"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Course Info */}
            <div className="lg:col-span-2 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium">
                  <BookOpen className="w-4 h-4 mr-2" />
                  {enhancedCourse.level} Level • {enhancedCourse.duration || 'Self-paced'}
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                  {course.title}
                </h1>
                <p className="text-sm text-blue-100 leading-relaxed max-w-3xl">
                  {descriptionLines[0] || course.description}
                </p>
              </motion.div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap gap-6 text-sm"
              >
                <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <span>{enhancedCourse.rating} Rating</span>
                </div>
                
                <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg">
                  <BarChart3 className="w-4 h-4" />
                  <span>{enhancedCourse.level}</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 px-3 py-2 rounded-lg">
                  <Languages className="w-4 h-4" />
                  <span>{enhancedCourse.language}</span>
                </div>
              </motion.div>
            </div>

            {/* Enrollment Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl"
            >
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">
                    {course.price > 0 ? `₹${course.price}` : "Free"}
                  </div>
                  <div className="text-blue-200 text-sm">
                    Enroll to access 
                  </div>
                </div>

                {!isEnrolled ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEnroll}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>Enroll Now</span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate(`/student/courses/${id}/learn`)}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <Play className="w-5 h-5" />
                    <span>Continue Learning</span>
                  </motion.button>
                )}

                <div className="space-y-3 text-sm text-blue-200">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Access to Live Sessions</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Live Mentor Support</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Discussion Forums</span>
                  </div>
                </div>

                
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Navigation Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {["overview", "curriculum", "instructors", "outcomes"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 font-medium text-sm border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Content Sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Description</h2>
                <div className="prose max-w-none text-gray-600 text-xs sm:text-sm space-y-4">
                  {descriptionLines.length > 0 ? (
                    descriptionLines.map((line, index) => (
                      <p key={index} style={{ whiteSpace: 'pre-line', fontWeight: 'normal' }} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    ))
                  ) : (
                    <p style={{ whiteSpace: 'pre-line', fontWeight: 'normal' }} dangerouslySetInnerHTML={{ __html: course.description?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') || '' }} />
                  )}
                </div>
              </div>

              {/* Features */}
              {course.features && course.features.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">What you'll learn</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {course.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Outcomes */}
              {course.outcomes && course.outcomes.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Outcomes</h2>
                  <div className="space-y-4">
                    {course.outcomes.map((outcome, index) => (
                      <div key={index} className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                        <Target className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <span className="text-gray-700 font-medium">{outcome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Course Info */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Course Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Level</span>
                    <span className="font-medium">{enhancedCourse.level}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{enhancedCourse.duration || 'Self-paced'} weeks</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Language</span>
                    <span className="font-medium">{enhancedCourse.language}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Mentor Support</span>
                    <span className="font-medium">{enhancedCourse.certificate ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Discussion Forums</span>
                    <span className="font-medium">{enhancedCourse.lifetimeAccess ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Requirements</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Basic computer knowledge</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Internet connection</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Willingness to learn</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Curriculum Tab */}
        {activeTab === "curriculum" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Curriculum</h2>
            {course.curriculum && course.curriculum.phases && course.curriculum.phases.length > 0 ? (
              <div className="space-y-6">
                {course.curriculum.phases.map((phase, phaseIndex) => (
                  <div key={phaseIndex} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Phase {phase.phaseNumber}: {phase.title}
                      </h3>
                      {phase.description && (
                        <p className="text-gray-600 mt-1 text-sm" style={{ whiteSpace: 'pre-line', fontWeight: 'normal' }} dangerouslySetInnerHTML={{ __html: phase.description?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') || '' }} />
                      )}
                    </div>
                    <div className="p-6 space-y-4">
                      {phase.weeks && phase.weeks.map((week, weekIndex) => (
                        <div key={weekIndex} className="border-l-4 border-blue-500 pl-4 py-2">
                          <h4 className="font-medium text-gray-900">
                            Week {week.weekNumber}: {week.title}
                          </h4>
                          {week.topics && week.topics.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {week.topics.map((topic, topicIndex) => (
                                <li key={topicIndex} className="flex items-center text-gray-600 text-sm">
                                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></div>
                                  {topic.title}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No curriculum information available</p>
            )}
          </motion.div>
        )}

        {/* Instructors Tab */}
        {activeTab === "instructors" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Instructors</h2>
            {course.instructors && course.instructors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {course.instructors.map((instructor, index) => (
                  <div key={index} className="flex items-start space-x-4 p-6 border border-gray-200 rounded-xl">
                    <img
                      src={instructor.photoUrl || `${defaultAvatar}${encodeURIComponent(instructor.name)}`}
                      alt={instructor.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{instructor.name}</h3>
                      <p className="text-blue-600 text-sm font-medium mt-1">{instructor.expertise}</p>
                      <p className="text-gray-600 text-sm mt-2">{instructor.bio}</p>
                      <p className="text-gray-500 text-xs mt-2">{instructor.experience}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No instructors information available</p>
            )}
          </motion.div>
        )}

        {/* Outcomes Tab */}
        {activeTab === "outcomes" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Outcomes</h2>
            {course.outcomes && course.outcomes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {course.outcomes.map((outcome, index) => (
                  <div key={index} className="flex items-start space-x-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Target className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Outcome {index + 1}</h3>
                      <p className="text-gray-600 mt-1">{outcome}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No outcomes information available</p>
            )}
          </motion.div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900">Complete Your Purchase</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium text-gray-900">{course.title}</h3>
                    <p className="text-sm text-gray-600">Course Enrollment</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹{course.price}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Billing Details</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={billingDetails.name}
                      onChange={(e) => setBillingDetails({...billingDetails, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={billingDetails.email}
                      onChange={(e) => setBillingDetails({...billingDetails, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      value={billingDetails.mobile}
                      onChange={(e) => setBillingDetails({...billingDetails, mobile: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your 10-digit mobile number"
                      maxLength="10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePayment}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                >
                  Pay Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;