import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock, CheckCircle } from "lucide-react";
import Cookies from 'js-cookie';
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
  const [duration, setDuration] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [attemptId, setAttemptId] = useState(searchParams.get('attemptId')); // ✅ get from URL
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    if (attemptId) {
      fetchQuestions(attemptId);
    } else {
      startTest();
    }
  }, [testId]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit(); // Auto-submit when time runs out
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Auto-save answers every 20 seconds
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      const autoSave = setInterval(() => {
        saveAnswersToServer();
      }, 20000);
      return () => clearInterval(autoSave);
    }
  }, [answers]);

  // ✅ Step 1: Launch test
  const startTest = async () => {
    try {
      const res = await api.post(`/tests/${testId}/launch`);
      if (res.data.success) {
        const { attemptId, duration } = res.data.data;
        setAttemptId(attemptId);
        setDuration(duration);
        setTimeLeft(duration * 60);
        fetchQuestions(attemptId);
      }
    } catch (error) {
      console.error("Start test error:", error);
      showError("Failed to start test");
      setLoading(false);
    }
  };

  // ✅ Step 2: Fetch questions
  const fetchQuestions = async (id) => {
    try {
      const res = await api.get(`/tests/${testId}/questions?attemptId=${id}`);
      if (res.data.success) {
        setQuestions(res.data.data.questions);
        // Load saved answers
        const savedAnswers = res.data.data.savedAnswers || [];
        const answersMap = {};
        savedAnswers.forEach(ans => {
          answersMap[ans.questionId] = {
            answer: ans.selectedOptions[0] || '',
            isMarkedForReview: ans.isMarkedForReview
          };
        });
        setAnswers(answersMap);
      }
    } catch (error) {
      console.error("Fetch questions error:", error);
      showError("Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  // Save answers to server
  const saveAnswersToServer = async () => {
    if (!attemptId || Object.keys(answers).length === 0) return;
    
    try {
      await api.post(`/tests/${testId}/save-answer`, {
        attemptId,
        answers: Object.entries(answers).map(([qId, ans]) => ({
          questionId: qId,
          selectedOptions: [ans.answer],
          isMarkedForReview: ans.isMarkedForReview,
          section: questions.find(q => q._id === qId)?.section || 'General'
        }))
      });
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  };

  // ✅ Step 3: Submit answers
  const handleSubmit = async () => {
    if (!attemptId) return showError("No attempt found");
    try {
      // Format answers for submission - backend expects just the answers
      const formattedAnswers = {};
      Object.keys(answers).forEach(qId => {
        formattedAnswers[qId] = answers[qId].answer;
      });
      
      const res = await api.post(`/students/attempts/${attemptId}/submit`, {
        answers: formattedAnswers,
      });
      if (res.data.success) {
        showSuccess("Test submitted successfully");
        navigate("/student/results"); // ✅ redirect to results
      }
    } catch (error) {
      console.error("Submit error:", error);
      showError("Failed to submit test");
    }
  };

  const handleAnswer = (qId, option) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        answer: option.text,
        isMarkedForReview: prev[qId]?.isMarkedForReview || false
      }
    }));
  };

  const toggleMarkForReview = (qId) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        isMarkedForReview: !prev[qId]?.isMarkedForReview
      }
    }));
  };

  if (loading) return <LoadingSpinner size="large" />;
  if (!questions.length)
    return <div className="p-6 text-gray-600">No questions available.</div>;

  const currentQ = questions[currentIndex];

  return (
    <div className="space-y-6 p-6">
      {/* Timer + Submit */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2 text-red-600 font-semibold">
          <Clock className="w-5 h-5" />
          <span>
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
          </span>
        </div>
        <button
          onClick={handleSubmit}
          className="btn-primary flex items-center"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Submit Test
        </button>
      </div>

      {/* Question */}
      <div className="card">
        <p className="font-medium text-gray-900 mb-4">
          Q{currentIndex + 1}. {currentQ.questionText}
        </p>
        <div className="space-y-2">
          <button
            onClick={() => toggleMarkForReview(currentQ._id)}
            className={`px-3 py-1 rounded-full text-sm ${
              answers[currentQ._id]?.isMarkedForReview
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {answers[currentQ._id]?.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
          </button>
          {currentQ.options.map((opt, i) => (
            <label
              key={i}
              className={`flex items-center p-3 border rounded-lg cursor-pointer ${
                answers[currentQ._id]?.answer === opt.text
                  ? "border-primary-500 bg-primary-50"
                  : "border-gray-300"
              }`}
            >
              <input
                type="radio"
                name={`q-${currentQ._id}`}
                checked={answers[currentQ._id]?.answer === opt.text}
                onChange={() => handleAnswer(currentQ._id, opt)}
                className="mr-3"
              />
              {opt.text}
            </label>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
          disabled={currentIndex === 0}
          className="btn-secondary flex items-center"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </button>
        <button
          onClick={() =>
            setCurrentIndex((i) => Math.min(i + 1, questions.length - 1))
          }
          disabled={currentIndex === questions.length - 1}
          className="btn-secondary flex items-center"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-2" />
        </button>
      </div>

      {/* Question Navigator */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-3">Question Navigator</h3>
        <div className="grid grid-cols-10 gap-2">
          {questions.map((q, idx) => (
            <button
              key={q._id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-10 h-10 rounded-full text-sm font-medium ${
                currentIndex === idx
                  ? "bg-primary-600 text-white"
                  : answers[q._id]
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {idx + 1}
              {answers[q._id]?.isMarkedForReview && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-4 mt-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-100 rounded-full"></div>
            <span>Answered</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gray-100 rounded-full"></div>
            <span>Not Answered</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-100 rounded-full relative">
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full"></div>
            </div>
            <span>Marked for Review</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamInterface;