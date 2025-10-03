import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle, Calendar, Clock, DollarSign,
  Video, BookOpen, Award, Users, Lock, Unlock, Play,
  X, ChevronLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useToast } from "../../context/ToastContext";

const RecordingsPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [showRecordingsModal, setShowRecordingsModal] = useState(false);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    fetchRecordings();
    window.scrollTo(0, 0);
  }, [courseId]);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/recordings/${courseId}`);
      if (res.data.success) {
        setCourse({
          title: res.data.data.courseTitle,
          description: res.data.data.description,
          outcomes: res.data.data.outcomes,
          features: res.data.data.features,
          sections: res.data.data.sections,
          startDate: res.data.data.startDate,
          duration: res.data.data.duration,
          price: res.data.data.price,
        });
        setRecordings(res.data.data.recordings || []);
        setIsUnlocked(res.data.data.isUnlocked);
      }
    } catch (err) {
      console.error(err);
      showError("Failed to load recordings");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async () => {
    try {
      const res = await api.post(`/recordings/unlock/${courseId}`);
      if (res.data.success) {
        showSuccess("Recordings unlocked successfully!");
        setIsUnlocked(true);
        fetchRecordings();
      }
    } catch (err) {
      console.error(err);
      showError("Failed to unlock recordings");
    }
  };

  // 🔗 Convert Google Drive links
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

  // Parse description into lines for better display
  const descriptionLines = course.description
    ? course.description.split('\n').filter(line => line.trim())
    : [];

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto space-y-8 p-4 md:p-6"
      >
        {/* Hero Card: Split Layout */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-0 shadow-sm">
          <div className="flex flex-col md:flex-row">
            {/* Left: Title & Description (70%) */}
            <div className="md:w-[70%] w-full p-8 flex flex-col justify-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {course.title} <span className="text-indigo-600">Recordings</span>
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

        {/* Unlock/View Recordings Button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center my-8"
        >
          {!isUnlocked ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleUnlock}
              className="btn-primary px-10 py-4 text-lg font-bold rounded-full shadow-lg flex items-center"
            >
              <Unlock className="w-5 h-5 mr-2" /> Unlock Recordings
              {course.price > 0 && <span className="ml-2">• ₹{course.price}</span>}
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowRecordingsModal(true)}
              className="btn-secondary px-10 py-4 text-lg font-bold rounded-full shadow-lg flex items-center"
            >
              <Video className="w-5 h-5 mr-2" /> View Recordings
              <span className="ml-2 bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-sm">
                {recordings.length}
              </span>
            </motion.button>
          )}
        </motion.div>

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
                                  <p className="text-sm text-gray-700">
                                    Expertise: {inst.expertise}
                                  </p>
                                  {inst.bio && (
                                    <p className="text-sm text-gray-600 mt-1">
                                      Bio: {inst.bio}
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

        
      </motion.div>
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
              className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-4 flex justify-between items-center sticky top-0 z-10">
                <div className="flex items-center">
                  <Video className="w-6 h-6 text-white mr-2" />
                  <h2 className="text-xl font-bold text-white">{course.title} Recordings</h2>
                </div>
                <button
                  onClick={closeRecordingsModal}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-4rem)]">
                {/* Selected Recording Player */}
                {selectedRecording && (
                  <div className="p-4 border-b">
                    <div className="flex items-center mb-3">
                      <button
                        onClick={() => setSelectedRecording(null)}
                        className="flex items-center text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        Back to all recordings
                      </button>
                    </div>

                    <h3 className="text-xl font-bold mb-2">{selectedRecording.title}</h3>
                    {selectedRecording.description && (
                      <p className="text-gray-700 mb-4">{selectedRecording.description}</p>
                    )}

                    <div className="relative rounded-lg overflow-hidden shadow-lg">
                      <video
                        src={getPlayableUrl(selectedRecording.videoUrl)}
                        controls
                        autoPlay
                        controlsList="nodownload"
                        className="w-full rounded-lg aspect-video"
                        poster={
                          selectedRecording.thumbnailUrl ||
                          "https://via.placeholder.com/530x360.png?text=Recording"
                        }
                      />
                    </div>

                    {selectedRecording.duration > 0 && (
                      <p className="text-sm text-gray-500 mt-3 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Duration: {selectedRecording.duration} minutes
                      </p>
                    )}
                  </div>
                )}

                {/* Recordings List */}
                {!selectedRecording && (
                  <div className="p-6">
                    {recordings.length === 0 ? (
                      <div className="text-center py-12">
                        <Video className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">No recordings available yet</h3>
                        <p className="text-gray-500">Check back later for new content</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recordings.map((rec, idx) => (
                          <motion.div
                            key={rec._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * idx }}
                            onClick={() => openRecording(rec)}
                            className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group"
                          >
                            <div className="relative">
                              <img
                                src={rec.thumbnailUrl || "https://via.placeholder.com/530x360.png?text=Recording"}
                                alt={rec.title}
                                className="w-full h-48 object-cover"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-white bg-opacity-90 rounded-full p-3">
                                  <Play className="w-8 h-8 text-indigo-600" />
                                </div>
                              </div>
                            </div>

                            <div className="p-4">
                              <h3 className="font-bold text-gray-900">{rec.title}</h3>
                              {rec.duration > 0 && (
                                <p className="text-sm text-gray-600 mt-1 flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {rec.duration} minutes
                                </p>
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
    </>
  );
};

export default RecordingsPage;