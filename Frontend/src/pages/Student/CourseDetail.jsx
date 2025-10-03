import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  CheckCircle, Calendar, Clock, DollarSign, User, 
  BookOpen, Award, Users
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

  // Parse description into lines for better display
  const descriptionLines = course.description ? course.description.split('\n').filter(line => line.trim()) : [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-6">
      {/* Hero Card: Split Layout */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-0 shadow-sm">
        <div className="flex flex-col md:flex-row">
          {/* Left: Title & Description (70%) */}
          <div className="md:w-[70%] w-full p-8 flex flex-col justify-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {course.title}
            </h1>
            <div className="text-lg text-gray-600 max-w-2xl">
              {descriptionLines.length > 0 ? (
                descriptionLines.map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))
              ) : (
                <span>{course.description}</span>
              )}
            </div>
          </div>
          {/* Right: Price, Duration, Start Date (30%) */}
          <div className="md:w-[30%] w-full bg-white/70 rounded-r-xl flex flex-col justify-center p-8 space-y-6 border-t md:border-t-0 md:border-l border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Price</p>
                <p className="text-lg font-bold text-gray-800">
                  {course.price > 0 ? `₹${course.price}` : "Free"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Start Date</p>
                <p className="text-lg font-bold text-gray-800">
                  {course.startDate ? new Date(course.startDate).toLocaleDateString() : "Flexible"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-3 rounded-full">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-lg font-bold text-gray-800">
                  {course.duration ? `${course.duration} weeks` : "Self-paced"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enroll Button - Centered and Prominent */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center my-8"
      >
        {!isEnrolled ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleEnroll}
            className="btn-primary px-10 py-4 text-lg font-bold rounded-full shadow-lg flex items-center"
          >
            <BookOpen className="w-5 h-5 mr-2" /> Enroll Now
            {course.price > 0 && <span className="ml-2">• ₹{course.price}</span>}
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/student/courses/${id}/learn`)}
            className="btn-secondary px-10 py-4 text-lg font-bold rounded-full shadow-lg flex items-center"
          >
            <BookOpen className="w-5 h-5 mr-2" /> Continue Learning
          </motion.button>
        )}
      </motion.div>

      {/* ...existing code for sections, outcomes, features... */}
      {/* Sections with Instructors */}
      {course.sections?.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card bg-white shadow-md rounded-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <BookOpen className="w-5 h-5 mr-2" /> Course Contents
            </h2>
          </div>
          <div className="p-6 space-y-6">
            {course.sections.map((section, idx) => (
              <motion.div 
                key={idx} 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Section Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b">
                  <h3 className="text-lg font-bold text-gray-900">
                    {section.title}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <BookOpen className="w-4 h-4 mr-1" /> 
                    {section.lessonsCount} {section.lessonsCount === 1 ? 'lesson' : 'lessons'}
                  </div>
                </div>
                
                {/* Section Content - Split into Left (Details) and Right (Instructors) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                  {/* Left Side - Section Details */}
                    <div className="text-gray-700" style={{ whiteSpace: "pre-line" }}>
                      {section.description}
                    </div>
                  
                  {/* Right Side - Instructors */}
                  <div className="border-t md:border-t-0 md:border-l border-gray-200 md:pl-4 pt-4 md:pt-0">
                    {section.instructors?.length > 0 ? (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <Users className="w-4 h-4 mr-2" /> 
                          Instructor{section.instructors.length > 1 ? 's' : ''}
                        </h4>
                        
                        <div className="space-y-4">
                          {section.instructors.map((inst, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2 + (0.1 * i) }}
                              className="flex items-start space-x-3 bg-gray-50 rounded-lg p-3"
                            >
                            <img
                              src={inst.photoUrl || `${defaultAvatar}${encodeURIComponent(inst.name)}`}
                              alt={inst.name}
                              className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                              onError={e => {
                                e.target.onerror = null;
                                e.target.src = `${defaultAvatar}${encodeURIComponent(inst.name)}`;
                              }}
                            />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {inst.name}
                                </p>
                                <p className="text-sm text-black-700">
                                  Expertise: {inst.expertise}
                                </p>
                                {inst.bio && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    Bio:{inst.bio}
                                  </p>
                                )}
                                {inst.experience && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {inst.experience} experience
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        No instructor information available
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
      {/* Outcomes and Features */}
      {(course.outcomes?.length > 0 || course.features?.length > 0) && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card bg-white shadow-md rounded-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-4">
            <h2 className="text-xl font-bold text-white">Course Overview</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {/* Outcomes */}
            {course.outcomes?.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-yellow-500" /> 
                  What you'll learn
                </h2>
                <ul className="space-y-3">
                  {course.outcomes.map((o, idx) => (
                    <motion.li 
                      key={idx} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className="flex items-start text-gray-700"
                    >
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" /> 
                      <span>{o}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Features */}
            {course.features?.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-blue-500" /> 
                  This course provides
                </h2>
                <ul className="space-y-3">
                  {course.features.map((f, idx) => (
                    <motion.li 
                      key={idx} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className="flex items-start text-gray-700"
                    >
                      <CheckCircle className="w-5 h-5 text-blue-500 mr-2 mt-1 flex-shrink-0" /> 
                      <span>{f}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}
export default CourseDetail;