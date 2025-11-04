import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle, Calendar, Clock, DollarSign,
  Video, BookOpen, Award, Users, Lock, Unlock, Play,
  X, ChevronLeft, FileText, ExternalLink, Download,
  Target, List, Star, Eye, Bookmark, Share2,
  User, Mail, Phone
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

const RecordingsPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [showRecordingsModal, setShowRecordingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [billingDetails, setBillingDetails] = useState({
    name: user?.name || "",
    email: user?.email || "",
    mobile: ""
  });
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    fetchRecordings();
    window.scrollTo(0, 0);
  }, [courseId]);

  useEffect(() => {
    if (isUnlocked) {
      fetchRecordingResources();
    }
  }, [isUnlocked, courseId]);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/recordings/${courseId}`);
      console.log("Recordings API response:", res.data);
      if (res.data.success) {
        const recordingsData = res.data.data;
        
        const courseData = {
          title: recordingsData.courseTitle,
          description: recordingsData.description,
          outcomes: recordingsData.outcomes || [],
          features: recordingsData.features || [],
          curriculum: {
            phases: []
          },
          instructors: [],
          startDate: recordingsData.startDate,
          duration: recordingsData.duration,
          price: recordingsData.price,
          rating: recordingsData.rating || 4.5,
          students: recordingsData.students || 1200,
          level: recordingsData.level || "Intermediate",
          language: recordingsData.language || "English",
          lastUpdated: recordingsData.lastUpdated || new Date().toISOString(),
        };
        
        if (recordingsData.curriculum?.phases?.length > 0) {
          courseData.curriculum.phases = recordingsData.curriculum.phases;
        } else if (recordingsData.sections?.length > 0) {
          courseData.curriculum.phases = recordingsData.sections.map((section, index) => ({
            phaseNumber: section.phaseNumber || index + 1,
            title: section.title,
            description: section.description,
            goal: section.goal || "",
            weeks: section.weeks || []
          }));
        }
        
        if (recordingsData.instructors?.length > 0) {
          courseData.instructors = recordingsData.instructors;
        } else if (recordingsData.sections) {
          const instructorMap = new Map();
          recordingsData.sections.forEach(section => {
            if (section.instructors?.length > 0) {
              section.instructors.forEach(instructor => {
                if (instructor._id) {
                  instructorMap.set(instructor._id, instructor);
                } else {
                  instructorMap.set(instructor.name, instructor);
                }
              });
            }
          });
          courseData.instructors = Array.from(instructorMap.values());
        }
        
        setCourse(courseData);
        setRecordings(recordingsData.recordings || []);
        setIsUnlocked(recordingsData.isUnlocked);
      }
    } catch (err) {
      console.error(err);
      showError("Failed to load recordings");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecordingResources = async () => {
    setResourcesLoading(true);
    try {
      const res = await api.get(`/courses/${courseId}/resourcesrecord`);
      setResources(res.data || []);
    } catch (error) {
      console.error("Failed to load recording resources:", error);
      showError("Failed to load recording resources");
    } finally {
      setResourcesLoading(false);
    }
  };

  const handleUnlock = async () => {
    try {
      // For paid recordings, show payment modal
      if (course.price > 0) {
        setShowPaymentModal(true);
      } else {
        // For free recordings, unlock directly
        const res = await api.post(`/recordings/unlock/${courseId}`);
        if (res.data.success) {
          showSuccess("Recordings unlocked successfully!");
          setIsUnlocked(true);
          fetchRecordings();
        }
      }
    } catch (err) {
      console.error(err);
      showError("Failed to unlock recordings");
    }
  };

  const handlePayment = async () => {
    try {
      console.log('Initiating payment for recordings:', courseId);
      
      // Validate course ID
      if (!courseId) {
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
      console.log('Creating order with data:', { courseId, billingDetails });

      // Create order
      const orderRes = await api.post("/payments/create-recording-order", {
        courseId: courseId,
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
                const verifyRes = await api.post("/payments/verify-recording-payment", {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                });

                if (verifyRes.data.success) {
                  showSuccess("Payment successful! Recordings unlocked.");
                  setIsUnlocked(true);
                  setShowPaymentModal(false);
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

  const getPlayableUrl = (url) => {
    if (!url) return "";
    if (url.includes("drive.google.com")) {
      const match = url.match(/\/d\/([^/]+)\//);
      if (match && match[1]) {
        return `https://drive.google.com/uc?export=download&id=${match[1]}`;
      }
    }
    return url;
  };

  const openRecording = (recording) => {
    setSelectedRecording(recording);
    setShowRecordingsModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeRecordingsModal = () => {
    setShowRecordingsModal(false);
    setSelectedRecording(null);
    document.body.style.overflow = 'auto';
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
      <p>The recordings you're looking for don't exist or have been removed.</p>
      <button
        onClick={() => navigate('/student/recordings')}
        className="mt-4 btn-secondary"
      >
        Browse Recordings
      </button>
    </motion.div>
  );

  const descriptionLines = course.description
    ? course.description.split('\n').filter(line => line.trim())
    : [];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 text-white"
        >
          <div className="absolute inset-0 bg-black/10"></div>
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
                  <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-sm font-medium border border-white/30 shadow-lg">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Recordings Course
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                    {course.title}
                  </h1>
                  <p className="text-base sm:text-sm text-blue-100 leading-relaxed max-w-3xl font-medium" style={{ fontWeight: 'normal' }} dangerouslySetInnerHTML={{ __html: (descriptionLines[0] || course.description)?.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-lg">$1</strong>') || '' }} />
                </motion.div>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-wrap gap-6 text-sm"
                >
                  <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-lg border border-white/20 shadow-sm hover:bg-white/20 transition-colors">
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                    <span className="font-medium">{course.rating} Rating</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-lg border border-white/20 shadow-sm hover:bg-white/20 transition-colors">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">{course.level}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-lg border border-white/20 shadow-sm hover:bg-white/20 transition-colors">
                    <Award className="w-5 h-5" />
                    <span className="font-medium">{course.language}</span>
                  </div>
                </motion.div>
              </div>

              {/* Action Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/30 shadow-2xl hover:shadow-3xl transition-shadow duration-300"
              >
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold mb-2 text-white">
                      {course.price > 0 ? `₹${course.price}` : "Free"}
                    </div>
                    <div className="text-blue-200 text-sm mb-4">
                      Unlock to access recordings
                    </div>
                  </div>

                  {!isUnlocked ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleUnlock}
                      className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 transform hover:-translate-y-1"
                    >
                      <Unlock className="w-5 h-5" />
                      <span className="text-lg">{course.price > 0 ? "Buy Recordings" : "Unlock Recordings"}</span>
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowRecordingsModal(true)}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 transform hover:-translate-y-1"
                    >
                      <Video className="w-5 h-5" />
                      <span className="text-lg">Watch Recordings</span>
                      <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                        {recordings.length} videos
                      </span>
                    </motion.button>
                  )}

                  <div className="space-y-3 text-sm text-blue-200">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Access upto one year</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Downloadable resources</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>Detailed Curriculum</span>
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
          className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8 overflow-x-auto">
              {["overview", "curriculum", "instructors", "resources"].map((tab) => (
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

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Course Description */}
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Course Description</h2>
                <div className="prose max-w-none text-gray-600 text-xs sm:text-sm leading-relaxed">
                  {descriptionLines.map((line, idx) => (
                    <p key={idx} className="mb-4" style={{ fontWeight: 'normal' }} dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-lg">$1</strong>') }} />
                  ))}
                </div>
              </div>

              {/* Outcomes & Features Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Outcomes */}
                {course.outcomes?.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <Award className="w-6 h-6 text-yellow-500 mr-3" />
                      What You'll Learn
                    </h3>
                    <div className="space-y-4">
                      {course.outcomes.map((outcome, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                          <span className="text-gray-700">{outcome}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Features */}
                {course.features?.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <Star className="w-6 h-6 text-blue-500 mr-3" />
                      Course Features
                    </h3>
                    <div className="space-y-4">
                      {course.features.map((feature, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <CheckCircle className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Curriculum Tab */}
          {activeTab === "curriculum" && course.curriculum?.phases?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <BookOpen className="w-6 h-6 text-purple-500 mr-3" />
                  Course Curriculum
                </h2>
                <div className="space-y-6">
                  {course.curriculum.phases.map((phase, phaseIdx) => (
                    <motion.div
                      key={phaseIdx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: phaseIdx * 0.1 }}
                      className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 border-b">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {phase.phaseNumber ? `Phase ${phase.phaseNumber}: ${phase.title}` : phase.title}
                            </h3>
                            {phase.goal && (
                              <p className="text-gray-600 mt-2 flex items-center">
                                <Target className="w-4 h-4 mr-2" />
                                {phase.goal}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {phase.weeks?.length || 0} weeks
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        {phase.description && (
                          <p className="text-gray-700 mb-6 leading-relaxed text-sm" style={{ whiteSpace: 'pre-line', fontWeight: 'normal' }} dangerouslySetInnerHTML={{ __html: phase.description?.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-lg">$1</strong>') || '' }} />
                        )}

                        <div className="space-y-4">
                          {phase.weeks?.map((week, weekIdx) => (
                            <div key={weekIdx} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                              <div className="flex items-center mb-3">
                                <div className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-1 rounded-full mr-4">
                                  Week {week.weekNumber || weekIdx + 1}
                                </div>
                                <h4 className="font-semibold text-gray-900">{week.title}</h4>
                              </div>

                              {week.goal && (
                                <p className="text-sm text-gray-600 mb-3">
                                  <span className="font-medium">Goal:</span> {week.goal}
                                </p>
                              )}

                              {week.topics?.length > 0 && (
                                <div>
                                  <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                    <List className="w-4 h-4 mr-2" />
                                    Topics Covered:
                                  </h5>
                                  <ul className="space-y-2">
                                    {week.topics.map((topic, topicIdx) => (
                                      <li key={topicIdx} className="flex items-start">
                                        <CheckCircle className="w-4 h-4 text-green-500 mt-1 mr-2 flex-shrink-0" />
                                        <div>
                                          <span className="font-medium text-gray-800">{topic.title}</span>
                                          {topic.description && (
                                            <span className="text-gray-600"> - {topic.description}</span>
                                          )}
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Instructors Tab */}
          {activeTab === "instructors" && course.instructors?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <Users className="w-6 h-6 text-green-500 mr-3" />
                  Meet Your Instructors
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {course.instructors.map((instructor, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start space-x-4">
                        <img
                          src={instructor.photoUrl || `${defaultAvatar}${encodeURIComponent(instructor.name)}`}
                          alt={instructor.name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-lg"
                          onError={e => {
                            e.target.onerror = null;
                            e.target.src = `${defaultAvatar}${encodeURIComponent(instructor.name)}`;
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-gray-900">{instructor.name}</h3>
                          {instructor.expertise && (
                            <p className="text-blue-600 font-medium text-sm">{instructor.expertise}</p>
                          )}
                          {instructor.experience && (
                            <p className="text-gray-600 text-sm mt-1">{instructor.experience}</p>
                          )}
                          {instructor.bio && (
                            <p className="text-gray-700 mt-3 leading-relaxed">{instructor.bio}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Resources Tab */}
          {activeTab === "resources" && isUnlocked && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                  <FileText className="w-6 h-6 text-orange-500 mr-3" />
                  Course Resources
                </h2>
                {resourcesLoading ? (
                  <div className="flex justify-center py-12">
                    <LoadingSpinner size="medium" />
                  </div>
                ) : resources.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resources.map((resource, idx) => (
                      <motion.div
                        key={resource._id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:border-blue-300 group"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <FileText className="w-8 h-8 text-blue-500" />
                          <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                          {resource.title}
                        </h3>
                        <a
                          href={resource.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                        >
                          Access Resource
                          <Download className="w-4 h-4 ml-1" />
                        </a>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No resources available</h3>
                    <p className="text-gray-500">Resources will be added soon</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Recordings Modal */}
      <AnimatePresence>
        {showRecordingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={closeRecordingsModal}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-6 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center space-x-3">
                  <Video className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-bold text-white">{course.title} Recordings</h2>
                  <span className="bg-white/20 px-2 py-1 rounded-full text-sm">
                    {recordings.length} recordings
                  </span>
                </div>
                <button
                  onClick={closeRecordingsModal}
                  className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-5rem)]">
                {selectedRecording ? (
                  <div className="p-6 space-y-6">
                    <button
                      onClick={() => setSelectedRecording(null)}
                      className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 mr-1" />
                      Back to all recordings
                    </button>

                    <div className="space-y-4">
                      <h3 className="text-2xl font-bold text-gray-900">{selectedRecording.title}</h3>
                      {selectedRecording.description && (
                        <p className="text-gray-700 text-lg leading-relaxed" style={{ whiteSpace: 'pre-line', fontWeight: 'normal' }} dangerouslySetInnerHTML={{ __html: selectedRecording.description?.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-lg">$1</strong>') || '' }} />
                      )}
                    </div>

                    <div className="relative rounded-xl overflow-hidden shadow-2xl bg-black">
                      <video
                        src={getPlayableUrl(selectedRecording.videoUrl)}
                        controls
                        autoPlay
                        controlsList="nodownload"
                        className="w-full rounded-xl aspect-video"
                        poster={selectedRecording.thumbnailUrl || "https://via.placeholder.com/530x360.png?text=Recording"}
                      />
                    </div>

                    {selectedRecording.duration > 0 && (
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-5 h-5 mr-2" />
                        Duration: {selectedRecording.duration} minutes
                      </div>
                    )}

                    {selectedRecording.resources?.length > 0 && (
                      <div className="border-t pt-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                          <FileText className="w-5 h-5 mr-2 text-green-600" />
                          Resources for this recording
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedRecording.resources.map((resource, idx) => (
                            <div
                              key={idx}
                              className="bg-blue-50 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-all"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <FileText className="w-5 h-5 text-blue-600" />
                                <ExternalLink className="w-4 h-4 text-blue-600" />
                              </div>
                              <h5 className="font-semibold text-gray-900 text-sm mb-2">{resource.title}</h5>
                              <a
                                href={resource.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                              >
                                Download Resource
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6">
                    {recordings.length === 0 ? (
                      <div className="text-center py-12">
                        <Video className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No recordings available yet</h3>
                        <p className="text-gray-500">Check back later for new content</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recordings.map((rec, idx) => (
                          <motion.div
                            key={rec._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer bg-white"
                            onClick={() => openRecording(rec)}
                          >
                            <div className="relative">
                              <img
                                src={rec.thumbnailUrl || "https://via.placeholder.com/530x360.png?text=Recording"}
                                alt={rec.title}
                                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-white rounded-full p-4 transform scale-90 group-hover:scale-100 transition-transform">
                                  <Play className="w-8 h-8 text-indigo-600" />
                                </div>
                              </div>
                              <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                                {rec.duration || '0'} min
                              </div>
                            </div>

                            <div className="p-4">
                              <h3 className="font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-indigo-600 transition-colors">
                                {rec.title}
                              </h3>
                              
                              {rec.resources?.length > 0 && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <FileText className="w-4 h-4 mr-1" />
                                  {rec.resources.length} resource{rec.resources.length !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Billing Details</h3>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={billingDetails.name}
                        onChange={(e) => setBillingDetails({...billingDetails, name: e.target.value})}
                        className="input-field pl-10"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={billingDetails.email}
                        onChange={(e) => setBillingDetails({...billingDetails, email: e.target.value})}
                        className="input-field pl-10"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        value={billingDetails.mobile}
                        onChange={(e) => setBillingDetails({...billingDetails, mobile: e.target.value})}
                        className="input-field pl-10"
                        placeholder="Enter 10-digit mobile number"
                        maxLength="10"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Recordings Access</p>
                        <p className="font-medium text-gray-900">{course.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-xl font-bold text-gray-900">₹{course.price}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handlePayment}
                    className="w-full btn-primary py-3"
                  >
                    Proceed to Payment
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    By proceeding, you agree to our terms and conditions
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RecordingsPage;