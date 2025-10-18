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

  useEffect(() => {
    fetchCourse();
    window.scrollTo(0, 0);
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
                <p className="text-xl text-blue-100 leading-relaxed max-w-3xl">
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
                  <Users className="w-4 h-4" />
                  <span>{enhancedCourse.students}+ Students</span>
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
                    One-time payment • Lifetime access
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
                    <span>Full lifetime access</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Certificate of completion</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Downloadable resources</span>
                  </div>
                </div>

                <div className="flex space-x-4 pt-4 border-t border-white/20">
                  <button className="flex-1 flex items-center justify-center space-x-2 text-blue-200 hover:text-white transition-colors">
                    <Bookmark className="w-4 h-4" />
                    <span className="text-sm">Save</span>
                  </button>
                  <button className="flex-1 flex items-center justify-center space-x-2 text-blue-200 hover:text-white transition-colors">
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm">Share</span>
                  </button>
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
              <div className="prose prose-lg max-w-none text-gray-600 leading-relaxed">
                {descriptionLines.map((line, idx) => (
                  <p key={idx} className="mb-4">{line}</p>
                ))}
              </div>
            </div>

            {/* Key Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <Calendar className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">Start Date</h3>
                <p className="text-gray-600">
                  {course.startDate ? new Date(course.startDate).toLocaleDateString() : "Flexible"}
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <Clock4 className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">Duration</h3>
                <p className="text-gray-600">
                  {course.duration ? `${course.duration} weeks` : "Self-paced"}
                </p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <BadgeCheck className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">Level</h3>
                <p className="text-gray-600">{enhancedCourse.level}</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-lg text-center">
                <Languages className="w-8 h-8 text-orange-500 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900">Language</h3>
                <p className="text-gray-600">{enhancedCourse.language}</p>
              </div>
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
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <BookOpen className="w-6 h-6 text-purple-500 mr-3" />
                  Course Curriculum
                </h2>
                <div className="text-sm text-gray-500">
                  {course.curriculum.phases.length} phases • {course.duration} weeks
                </div>
              </div>
              
              <div className="space-y-6">
                {course.curriculum.phases.map((phase, phaseIdx) => (
                  <motion.div
                    key={phaseIdx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: phaseIdx * 0.1 }}
                    className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300"
                  >
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="bg-purple-500 text-white rounded-lg w-12 h-12 flex items-center justify-center font-bold text-lg">
                            {phase.phaseNumber}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              {phase.title}
                            </h3>
                            {phase.goal && (
                              <p className="text-gray-600 mt-1 flex items-center">
                                <Target className="w-4 h-4 mr-2" />
                                {phase.goal}
                              </p>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    <div className="p-6">
                      {phase.description && (
                        <p className="text-gray-700 mb-6 leading-relaxed">{phase.description}</p>
                      )}

                      <div className="space-y-4">
                        {phase.weeks?.map((week, weekIdx) => (
                          <div key={weekIdx} className="border border-gray-100 rounded-lg p-5 bg-gray-50 hover:bg-white transition-colors">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-4">
                                <div className="bg-blue-100 text-blue-800 text-sm font-bold px-3 py-2 rounded-lg">
                                  Week {week.weekNumber}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-gray-900 text-lg">{week.title}</h4>
                                  {week.goal && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      <span className="font-medium">Goal:</span> {week.goal}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {week.topics?.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                  <List className="w-4 h-4 mr-2" />
                                  Topics Covered:
                                </h5>
                                <ul className="space-y-3">
                                  {week.topics.map((topic, topicIdx) => (
                                    <li key={topicIdx} className="flex items-start group hover:bg-white p-2 rounded-lg transition-colors">
                                      <CheckCircle className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0 group-hover:scale-110 transition-transform" />
                                      <div>
                                        <span className="font-medium text-gray-900">{topic.title}</span>
                                        {topic.description && (
                                          <p className="text-gray-600 text-sm mt-1">{topic.description}</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {course.instructors.map((instructor, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="flex items-start space-x-6">
                      <div className="relative">
                        <img
                          src={instructor.photoUrl || `${defaultAvatar}${encodeURIComponent(instructor.name)}`}
                          alt={instructor.name}
                          className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-lg group-hover:scale-105 transition-transform duration-300"
                          onError={e => {
                            e.target.onerror = null;
                            e.target.src = `${defaultAvatar}${encodeURIComponent(instructor.name)}`;
                          }}
                        />
                        <div className="absolute -bottom-2 -right-2 bg-green-500 text-white p-1 rounded-full">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                          {instructor.name}
                        </h3>
                        {instructor.expertise && (
                          <p className="text-green-600 font-semibold text-sm mt-1">{instructor.expertise}</p>
                        )}
                        {instructor.experience && (
                          <p className="text-gray-600 text-sm mt-2">{instructor.experience}</p>
                        )}
                        {instructor.bio && (
                          <p className="text-gray-700 mt-3 leading-relaxed text-sm">{instructor.bio}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Outcomes Tab */}
        {activeTab === "outcomes" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Outcomes & Features Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Outcomes */}
              {course.outcomes?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
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
                        className="flex items-start space-x-4 p-4 rounded-xl hover:bg-yellow-50 transition-colors group"
                      >
                        <div className="bg-yellow-100 p-2 rounded-lg group-hover:scale-110 transition-transform">
                          <CheckCircle className="w-5 h-5 text-yellow-600" />
                        </div>
                        <span className="text-gray-700 text-lg leading-relaxed">{outcome}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              {course.features?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
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
                        className="flex items-start space-x-4 p-4 rounded-xl hover:bg-blue-50 transition-colors group"
                      >
                        <div className="bg-blue-100 p-2 rounded-lg group-hover:scale-110 transition-transform">
                          <CheckCircle className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-gray-700 text-lg leading-relaxed">{feature}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Final CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-8 text-center text-white"
            >
              <h3 className="text-2xl font-bold mb-4">Ready to Start Your Journey?</h3>
              <p className="text-blue-100 text-lg mb-6 max-w-2xl mx-auto">
                Join {enhancedCourse.students}+ students who have already transformed their skills with this course.
              </p>
              {!isEnrolled ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEnroll}
                  className="bg-white text-blue-600 font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 mx-auto"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>Enroll Now for {course.price > 0 ? `₹${course.price}` : "Free"}</span>
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/student/courses/${id}/learn`)}
                  className="bg-white text-blue-600 font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2 mx-auto"
                >
                  <Play className="w-5 h-5" />
                  <span>Continue Learning</span>
                </motion.button>
              )}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default CourseDetail;