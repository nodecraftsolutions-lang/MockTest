import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock, CheckCircle, Flag, AlertTriangle } from "lucide-react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useToast } from "../../context/ToastContext";

const ExamInterface = () => {
  const { testId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [duration, setDuration] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [attemptId, setAttemptId] = useState(searchParams.get('attemptId'));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    if (attemptId) {
      fetchQuestions(attemptId);
    } else {
      startTest();
    }
  }, [testId]);

  useEffect(() => {
    if (timeLeft <= 0 && timeLeft !== null) {
      handleAutoSubmit();
      return;
    }
    if (timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  // Auto-save answers every 30 seconds
  useEffect(() => {
    if (attemptId && Object.keys(answers).length > 0) {
      const autoSave = setInterval(() => {
        saveAnswersToServer();
      }, 30000);
      return () => clearInterval(autoSave);
    }
  }, [answers, attemptId]);

  // Prevent page refresh and navigation
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your progress will be lost.';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const startTest = async () => {
    try {
      const res = await api.post(`/tests/${testId}/launch`);
      if (res.data.success) {
        const { attemptId, duration, startTime, serverTime } = res.data.data;
        setAttemptId(attemptId);
        setDuration(duration);
        
        // Calculate time left based on server time
        const start = new Date(startTime);
        const server = new Date(serverTime);
        const elapsed = Math.floor((server - start) / 1000);
        const remaining = Math.max(0, (duration * 60) - elapsed);
        setTimeLeft(remaining);
        
        fetchQuestions(attemptId);
      }
    } catch (error) {
      console.error("Start test error:", error);
      showError(error.response?.data?.message || "Failed to start test");
      setLoading(false);
    }
  };

  const fetchQuestions = async (id) => {
    try {
      const res = await api.get(`/tests/${testId}/questions?attemptId=${id}`);
      if (res.data.success) {
        setQuestions(res.data.data.questions);
        
        // Load saved answers
        const savedAnswers = res.data.data.savedAnswers || [];
        const answersMap = {};
        const reviewMap = {};
        
        savedAnswers.forEach(ans => {
          if (ans.selectedOptions && ans.selectedOptions.length > 0) {
            answersMap[ans.questionId] = ans.selectedOptions[0];
          }
          if (ans.isMarkedForReview) {
            reviewMap[ans.questionId] = true;
          }
        });
        
        setAnswers(answersMap);
        setMarkedForReview(reviewMap);
      }
    } catch (error) {
      console.error("Fetch questions error:", error);
      showError(error.response?.data?.message || "Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const saveAnswersToServer = async () => {
    if (!attemptId || Object.keys(answers).length === 0) return;
    
    try {
      // Save each answer individually
      for (const [questionId, answer] of Object.entries(answers)) {
        const question = questions.find(q => q._id === questionId);
        await api.post(`/tests/${testId}/save-answer`, {
          attemptId,
          questionId,
          selectedOptions: [answer],
          isMarkedForReview: markedForReview[questionId] || false,
          section: question?.section || 'General'
        });
      }
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  };

  const handleAnswer = (qId, option) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: option.text
    }));
  };

  const toggleMarkForReview = (qId) => {
    setMarkedForReview((prev) => ({
      ...prev,
      [qId]: !prev[qId]
    }));
  };

  const handleSubmit = async () => {
    if (!attemptId) return showError("No attempt found");
    
    setSubmitting(true);
    try {
      const res = await api.post(`/tests/attempts/${attemptId}/submit`, {
        answers: answers
      });
      
      if (res.data.success) {
        showSuccess("Test submitted successfully!");
        navigate(`/student/results/${attemptId}`);
      }
    } catch (error) {
      console.error("Submit error:", error);
      showError(error.response?.data?.message || "Failed to submit test");
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (!attemptId) return;
    
    try {
      await api.post(`/tests/attempts/${attemptId}/submit`, {
        answers: answers
      });
      showError("Time expired! Test auto-submitted.");
      navigate(`/student/results/${attemptId}`);
    } catch (error) {
      console.error("Auto-submit error:", error);
      navigate("/student/results");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const getQuestionStatus = (qId) => {
    if (markedForReview[qId]) return 'review';
    if (answers[qId]) return 'answered';
    return 'unanswered';
  };

  if (loading) return <LoadingSpinner size="large" />;
  if (!questions.length) return <div className="p-6 text-gray-600">No questions available.</div>;

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const reviewCount = Object.keys(markedForReview).filter(k => markedForReview[k]).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Mock Test</h1>
            <p className="text-sm text-gray-600">Question {currentIndex + 1} of {questions.length}</p>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 text-red-600 font-semibold">
              <Clock className="w-5 h-5" />
              <span className="text-lg">{formatTime(timeLeft)}</span>
            </div>
            
            <button
              onClick={() => setShowSubmitModal(true)}
              className="btn-primary flex items-center"
              disabled={submitting}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Submit Test
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-6">
          {/* Question Card */}
          <div className="card mb-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Question {currentIndex + 1}
              </h2>
              <button
                onClick={() => toggleMarkForReview(currentQ._id)}
                className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  markedForReview[currentQ._id]
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Flag className="w-4 h-4 mr-1" />
                {markedForReview[currentQ._id] ? 'Marked for Review' : 'Mark for Review'}
              </button>
            </div>
            
            <p className="text-gray-800 mb-6 leading-relaxed">
              {currentQ.questionText}
            </p>
            
            <div className="space-y-3">
              {currentQ.options.map((opt, i) => (
                <label
                  key={i}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    answers[currentQ._id] === opt.text
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${currentQ._id}`}
                    checked={answers[currentQ._id] === opt.text}
                    onChange={() => handleAnswer(currentQ._id, opt)}
                    className="mr-3 text-primary-600"
                  />
                  <span className="text-gray-800">{opt.text}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
              disabled={currentIndex === 0}
              className="btn-secondary flex items-center disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  if (answers[currentQ._id]) {
                    setAnswers(prev => {
                      const newAnswers = { ...prev };
                      delete newAnswers[currentQ._id];
                      return newAnswers;
                    });
                  }
                }}
                className="btn-secondary"
              >
                Clear Answer
              </button>
              
              <button
                onClick={() => setCurrentIndex((i) => Math.min(i + 1, questions.length - 1))}
                disabled={currentIndex === questions.length - 1}
                className="btn-primary flex items-center"
              >
                Save & Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        </div>

        {/* Question Navigator Sidebar */}
        <div className="w-80 bg-white border-l p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Navigator</h3>
            
            {/* Summary */}
            <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
              <div className="text-center p-2 bg-green-50 rounded">
                <div className="font-semibold text-green-800">{answeredCount}</div>
                <div className="text-green-600">Answered</div>
              </div>
              <div className="text-center p-2 bg-yellow-50 rounded">
                <div className="font-semibold text-yellow-800">{reviewCount}</div>
                <div className="text-yellow-600">Review</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="font-semibold text-gray-800">{questions.length - answeredCount}</div>
                <div className="text-gray-600">Unanswered</div>
              </div>
            </div>
          </div>

          {/* Question Grid */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            {questions.map((q, idx) => {
              const status = getQuestionStatus(q._id);
              return (
                <button
                  key={q._id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`relative w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                    currentIndex === idx
                      ? "bg-primary-600 text-white"
                      : status === 'answered'
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : status === 'review'
                      ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {idx + 1}
                  {status === 'review' && (
                    <Flag className="absolute -top-1 -right-1 w-3 h-3 text-yellow-600" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 rounded"></div>
              <span className="text-gray-600">Answered</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-100 rounded relative">
                <Flag className="absolute -top-0.5 -right-0.5 w-2 h-2 text-yellow-600" />
              </div>
              <span className="text-gray-600">Marked for Review</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 rounded"></div>
              <span className="text-gray-600">Not Answered</span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="w-full mt-6 btn-primary"
            disabled={submitting}
          >
            Submit Test
          </button>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Submit Test?</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Are you sure you want to submit your test? You cannot change your answers after submission.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Questions:</span>
                  <span className="font-medium">{questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Answered:</span>
                  <span className="font-medium text-green-600">{answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Marked for Review:</span>
                  <span className="font-medium text-yellow-600">{reviewCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Unanswered:</span>
                  <span className="font-medium text-red-600">{questions.length - answeredCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Time Remaining:</span>
                  <span className="font-medium text-blue-600">{formatTime(timeLeft)}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 btn-secondary"
                disabled={submitting}
              >
                Continue Test
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamInterface;