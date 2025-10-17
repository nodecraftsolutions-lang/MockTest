import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  CheckCircle, Calendar, Clock, DollarSign, User, 
  BookOpen, Award, Users, List, Target
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

      {/* Curriculum with Phases, Weeks, and Topics */}
      {course.curriculum?.phases?.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card bg-white shadow-md rounded-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <BookOpen className="w-5 h-5 mr-2" /> Course Curriculum
            </h2>
          </div>
          <div className="p-6 space-y-8">
            {course.curriculum.phases.map((phase, phaseIdx) => (
              <motion.div 
                key={phaseIdx} 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * phaseIdx }}
                className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Phase Header */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 border-b">
                  <h3 className="text-lg font-bold text-gray-900">
                    Phase {phase.phaseNumber}: {phase.title}
                  </h3>
                  {phase.goal && (
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Target className="w-4 h-4 mr-1" /> 
                      Goal: {phase.goal}
                    </div>
                  )}
                </div>
                
                {/* Phase Content */}
                <div className="p-4">
                  {phase.description && (
                    <div className="text-gray-700 mb-4" style={{ whiteSpace: "pre-line" }}>
                      {phase.description}
                    </div>
                  )}
                  
                  {/* Weeks in this Phase */}
                  <div className="space-y-4">
                    {phase.weeks?.map((week, weekIdx) => (
                      <div key={weekIdx} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-3">
                          <div className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded mr-3">
                            Week {week.weekNumber}
                          </div>
                          <h4 className="font-semibold text-gray-900">{week.title}</h4>
                        </div>
                        
                        {week.goal && (
                          <div className="text-sm text-gray-600 mb-3">
                            <span className="font-medium">Goal:</span> {week.goal}
                          </div>
                        )}
                        
                        {/* Topics in this Week */}
                        {week.topics?.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <List className="w-4 h-4 mr-1" />
                              Topics Covered:
                            </h5>
                            <ul className="space-y-2">
                              {week.topics.map((topic, topicIdx) => (
                                <li key={topicIdx} className="flex items-start">
                                  <CheckCircle className="w-4 h-4 text-green-500 mt-1 mr-2 flex-shrink-0" />
                                  <div>
                                    <span className="font-medium">{topic.title}</span>
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
        </motion.div>
      )}
      
      {/* Course Instructors */}
      {course.instructors?.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card bg-white shadow-md rounded-xl overflow-hidden"
        >
          <div className="bg-gradient-to-r from-green-500 to-teal-600 p-4">
            <h2 className="text-xl font-bold text-white flex items-center">
              <Users className="w-5 h-5 mr-2" /> Faculty You'll Learn From
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {course.instructors.map((instructor, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row items-center md:items-start gap-4 hover:shadow-md transition-shadow"
                >
                  <img
                    src={instructor.photoUrl || `${defaultAvatar}${encodeURIComponent(instructor.name)}`}
                    alt={instructor.name}
                    className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-sm"
                    onError={e => {
                      e.target.onerror = null;
                      e.target.src = `${defaultAvatar}${encodeURIComponent(instructor.name)}`;
                    }}
                  />
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-lg font-bold text-gray-900">{instructor.name}</h3>
                    {instructor.expertise && (
                      <p className="text-sm text-blue-600 font-medium">{instructor.expertise}</p>
                    )}
                    {instructor.experience && (
                      <p className="text-sm text-gray-600 mt-1">{instructor.experience}</p>
                    )}
                    {instructor.bio && (
                      <p className="text-sm text-gray-700 mt-2">{instructor.bio}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
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