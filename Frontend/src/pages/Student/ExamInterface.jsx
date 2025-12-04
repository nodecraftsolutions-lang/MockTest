import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Clock, CheckCircle, Flag,
  AlertTriangle, BookOpen, Lock, ExternalLink
} from "lucide-react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { createSanitizedHtml } from "../../utils/sanitize";

const ExamInterface = () => {
  const { testId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [sections, setSections] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentSection, setCurrentSection] = useState('');
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [duration, setDuration] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [attemptId, setAttemptId] = useState(searchParams.get('attemptId'));
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [previousAttempt, setPreviousAttempt] = useState(null);
  const [testAlreadyAttempted, setTestAlreadyAttempted] = useState(false);
  const { showError, showSuccess } = useToast();
  
  // All tests now use the same API endpoints
  const isMockTest = false;
  
  // Get the appropriate return path based on test type
  const getReturnPath = () => {
    return '/student/mock-tests';
  };

  // Check for completed attempt in session storage to handle post-submission navigation
  useEffect(() => {
    // Use different storage keys for mock tests vs regular tests
    const storageKeyPrefix = 'mock_test_';
    const completedTestKey = `${storageKeyPrefix}${testId}_completed_${user?.id || 'anonymous'}`;
    const hasCompletedTest = sessionStorage.getItem(completedTestKey);
    
    if (hasCompletedTest) {
      try {
        const attemptData = JSON.parse(hasCompletedTest);
        setTestAlreadyAttempted(true);
        setPreviousAttempt(attemptData);
        setLoading(false);
      } catch (e) {
        // If parsing fails, proceed with normal flow
        startTest();
      }
    } else {
      startTest();
    }
    // eslint-disable-next-line
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

  useEffect(() => {
    if (attemptId && Object.keys(answers).length > 0) {
      const autoSave = setInterval(() => {
        saveAnswersToServer();
      }, 20000);
      return () => clearInterval(autoSave);
    }
  }, [answers, attemptId]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!testAlreadyAttempted) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your progress will be lost.';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [testAlreadyAttempted]);

  const startTest = async () => {
    try {
      // Use the standard tests endpoint for all tests
      const apiEndpoint = `/tests/${testId}/launch`;
        
      const res = await api.post(apiEndpoint, {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      if (res.data.success) {
        const { attemptId, duration, startTime, serverTime } = res.data.data;
        setAttemptId(attemptId);
        setDuration(duration);
        const start = new Date(startTime);
        const server = new Date(serverTime);
        const elapsed = Math.floor((server - start) / 1000);
        const remaining = Math.max(0, (duration * 60) - elapsed);
        setTimeLeft(remaining);
        fetchQuestions(attemptId);
      }
    } catch (error) {
      // Check if it's a 403 error (already attempted)
      if (error.response?.status === 403 && error.response?.data?.message?.includes('already attempted')) {
        setTestAlreadyAttempted(true);
        setLoading(false);
      } else {
        showError(error.response?.data?.message || "Failed to start test");
      }
      setLoading(false);
    }
  };

  const fetchQuestions = async (id) => {
    try {
      // Use the standard tests endpoint for all tests
      const apiEndpoint = `/tests/${testId}/questions?attemptId=${id}`;
        
      const res = await api.get(apiEndpoint);
      
      if (res.data.success) {
        const { questions, sections, savedAnswers, attempt } = res.data.data;
        
        // Check if the attempt is already submitted
        if (attempt && (attempt.status === 'submitted' || attempt.status === 'completed')) {
          setTestAlreadyAttempted(true);
          setPreviousAttempt(attempt);
          
          // Store completed test info in session storage
          const storageKeyPrefix = 'mock_test_';
          const completedTestKey = `${storageKeyPrefix}${testId}_completed_${user?.id || 'anonymous'}`;
          sessionStorage.setItem(completedTestKey, JSON.stringify(attempt));
          
          setLoading(false);
          return;
        }
        
        setQuestions(questions);
        setSections(sections || []);
        if (questions.length > 0) setCurrentSection(questions[0].section);
        const answersMap = {};
        const reviewMap = {};
        savedAnswers?.forEach(ans => {
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
      showError(error.response?.data?.message || "Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const saveAnswersToServer = async () => {
    if (!attemptId || Object.keys(answers).length === 0) return;
    setAutoSaving(true);
    try {
      const currentQuestion = questions[currentIndex];
      if (currentQuestion && answers[currentQuestion._id]) {
        // Use the standard tests endpoint for all tests
        const apiEndpoint = `/tests/${testId}/save-answer`;
          
        await api.post(apiEndpoint, {
          attemptId,
          questionId: currentQuestion._id,
          selectedOptions: Array.isArray(answers[currentQuestion._id]) 
            ? answers[currentQuestion._id] 
            : [answers[currentQuestion._id]],
          isMarkedForReview: markedForReview[currentQuestion._id] || false,
          section: currentQuestion.section
        });
      }
    } catch {}
    finally {
      setAutoSaving(false);
    }
  };

  const handleAnswer = (qId, option) => {
    const currentQ = questions[currentIndex];
    
    if (currentQ.questionType === 'multiple') {
      // For multiple choice questions, allow selecting multiple options
      setAnswers((prev) => {
        const currentAnswers = prev[qId] || [];
        let newAnswers;
        
        if (currentAnswers.includes(option.text)) {
          // Remove option if already selected
          newAnswers = currentAnswers.filter(ans => ans !== option.text);
        } else {
          // Add option if not selected
          newAnswers = [...currentAnswers, option.text];
        }
        
        return {
          ...prev,
          [qId]: newAnswers
        };
      });
    } else {
      // For single choice questions, only one option can be selected
      setAnswers((prev) => ({
        ...prev,
        [qId]: option.text
      }));
    }
    
    setTimeout(() => saveAnswersToServer(), 1000);
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
      // Use the standard tests endpoint for all tests
      const apiEndpoint = `/tests/attempts/${attemptId}/submit`;
        
      const res = await api.post(apiEndpoint, { answers });
      if (res.data.success) {
        showSuccess("Test submitted successfully!");
        
        // Mark this test as completed in session storage
        const storageKeyPrefix = 'mock_test_';
        const completedTestKey = `${storageKeyPrefix}${testId}_completed_${user?.id || 'anonymous'}`;
        const attemptData = {
          _id: attemptId,
          submittedAt: new Date().toISOString(),
          startTime: new Date().toISOString(),
          ...res.data.data
        };
        sessionStorage.setItem(completedTestKey, JSON.stringify(attemptData));
        
        // Set state to show the completed view if they navigate back
        setTestAlreadyAttempted(true);
        setPreviousAttempt(attemptData);
        
        // Navigate to the appropriate results page
        const resultsPath = `/student/results/${attemptId}`;
        navigate(resultsPath);
      }
    } catch (error) {
      showError(error.response?.data?.message || "Failed to submit test");
    } finally {
      setSubmitting(false);
      setShowSubmitModal(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (!attemptId) return;
    try {
      // Use the standard tests endpoint for all tests
      const apiEndpoint = `/tests/attempts/${attemptId}/submit`;
        
      const res = await api.post(apiEndpoint, { answers });
      
      // Mark this test as completed in session storage
      if (res.data.success) {
        const storageKeyPrefix = 'mock_test_';
        const completedTestKey = `${storageKeyPrefix}${testId}_completed_${user?.id || 'anonymous'}`;
        const attemptData = {
          _id: attemptId,
          submittedAt: new Date().toISOString(),
          startTime: new Date().toISOString(),
          ...res.data.data
        };
        sessionStorage.setItem(completedTestKey, JSON.stringify(attemptData));
      }
      
      showError("Time expired! Test auto-submitted.");
    
      // Navigate to the appropriate results page
      const resultsPath = `/student/results/${attemptId}`;
      navigate(resultsPath);
    } catch {
      navigate(getReturnPath());
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

  const getSectionQuestions = (sectionName) => {
    return questions.filter(q => q.section === sectionName);
  };

  const getSectionStats = (sectionName) => {
    const sectionQuestions = getSectionQuestions(sectionName);
    const answered = sectionQuestions.filter(q => answers[q._id]).length;
    const reviewed = sectionQuestions.filter(q => markedForReview[q._id]).length;
    return {
      total: sectionQuestions.length,
      answered,
      reviewed,
      unanswered: sectionQuestions.length - answered
    };
  };

  const jumpToSection = (sectionName) => {
    const sectionIndex = questions.findIndex(q => q.section === sectionName);
    if (sectionIndex !== -1) {
      setCurrentIndex(sectionIndex);
      setCurrentSection(sectionName);
    }
  };

  // Get the appropriate results path based on test type
  const getResultsPath = () => {
    if (!previousAttempt || (!previousAttempt._id && !attemptId)) return null;
    
    const id = previousAttempt._id || attemptId;
    return `/student/results/${id}`;
  };

  // Show already attempted message
  if (testAlreadyAttempted) {
    const resultsPath = getResultsPath();
    const returnPath = getReturnPath();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full text-center">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Test Already Attempted</h1>
          <p className="text-gray-600 mb-6">
            You've already attempted this mock test. Only one attempt is allowed per test.
          </p>
          
          {previousAttempt && (
            <div className="bg-blue-50 rounded-lg p-5 mb-6 text-left">
              <h3 className="font-semibold text-blue-800 mb-3">Your Previous Attempt</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{new Date(previousAttempt.submittedAt || previousAttempt.startTime).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Score:</span>
                  <span className="font-medium">
                    {previousAttempt.score !== undefined ? `${previousAttempt.score}/${previousAttempt.totalMarks || '?'}` : 'Not available'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-green-600">
                    Completed
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {resultsPath && (
              <button 
                onClick={() => navigate(resultsPath)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                View Results <ExternalLink className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <LoadingSpinner size="large" />;
  if (!questions.length) return <div className="p-6 text-gray-600">No questions available.</div>;

  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const reviewCount = Object.keys(markedForReview).filter(k => markedForReview[k]).length;
  const uniqueSections = [...new Set(questions.map(q => q.section))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/90 shadow-lg border-b px-4 sm:px-8 py-4 sm:py-5 sticky top-0 z-30 rounded-b-2xl">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-primary-700 flex items-center gap-2">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
              Mock Test
            </h1>
            <p className="text-xs sm:text-sm text-gray-600">
              Question {currentIndex + 1} of {questions.length} • Section: <span className="font-semibold">{currentQ?.section}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-6">
            {autoSaving && (
              <div className="flex items-center text-blue-600 text-xs sm:text-sm">
                <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-600 mr-1 sm:mr-2"></div>
                Auto-saving...
              </div>
            )}
            <div className="flex items-center space-x-2 text-red-600 font-semibold bg-red-50 px-3 sm:px-4 py-1 sm:py-2 rounded-full shadow">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-lg">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto py-4 sm:py-8 px-2 sm:px-6 gap-4 sm:gap-8">
        {/* Main Content */}
        <div className="flex-1">
          {/* Mobile Question Navigator - Show on mobile and tablet */}
          <div className="lg:hidden mb-4 sm:mb-6 bg-white rounded-xl shadow p-4">
            <h3 className="text-base sm:text-lg font-bold text-primary-700 mb-3 flex items-center">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary-600" />
              Question Navigator
            </h3>
            
            {/* Mobile Summary */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 text-xs sm:text-sm">
              <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                <div className="font-semibold text-green-800">{answeredCount}</div>
                <div className="text-green-600">Answered</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-yellow-50 rounded-lg">
                <div className="font-semibold text-yellow-800">{reviewCount}</div>
                <div className="text-yellow-600">Review</div>
              </div>
              <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div className="font-semibold text-gray-800">{questions.length - answeredCount}</div>
                <div className="text-gray-600">Unanswered</div>
              </div>
            </div>
            
            {/* Mobile Section Navigation */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mb-3">
                {uniqueSections.map((sectionName) => {
                  const stats = getSectionStats(sectionName);
                  const isCurrentSection = currentQ?.section === sectionName;
                  return (
                    <button
                      key={sectionName}
                      onClick={() => jumpToSection(sectionName)}
                      className={`px-3 py-1 sm:px-4 sm:py-2 rounded-full border text-xs sm:text-sm font-semibold shadow transition-all
                        ${isCurrentSection
                          ? 'border-primary-500 bg-primary-100 text-primary-700 scale-105'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-primary-50 hover:border-primary-200'
                        }`}
                    >
                      {sectionName} <span className="ml-1 sm:ml-2 text-xs text-gray-500">({stats.answered}/{stats.total})</span>
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Mobile Question Grid */}
            <div className="space-y-4">
              {uniqueSections.map((sectionName) => {
                const stats = getSectionStats(sectionName);
                const sectionQuestions = getSectionQuestions(sectionName);
                const startIndex = questions.findIndex(q => q.section === sectionName);
                return (
                  <div key={sectionName} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{sectionName}</h4>
                      <span className="text-xs text-gray-600">{stats.answered}/{stats.total}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {sectionQuestions.map((q, idx) => {
                        const globalIndex = startIndex + idx;
                        const status = getQuestionStatus(q._id);
                        return (
                          <button
                            key={q._id}
                            onClick={() => setCurrentIndex(globalIndex)}
                            className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded text-xs font-bold transition-all
                              ${currentIndex === globalIndex
                                ? "bg-primary-600 text-white scale-110"
                                : status === 'answered'
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : status === 'review'
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                          >
                            {idx + 1}
                            {status === 'review' && (
                              <Flag className="absolute -top-1 -right-1 w-2 h-2 text-yellow-600" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Mobile Legend */}
            <div className="flex flex-wrap gap-2 mt-4 text-xs">
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-green-100 rounded"></div>
                <span className="text-gray-600">Answered</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-yellow-100 rounded relative">
                  <Flag className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 text-yellow-600" />
                </div>
                <span className="text-gray-600">Review</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-gray-100 rounded"></div>
                <span className="text-gray-600">Not Answered</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-3 h-3 bg-primary-600 rounded"></div>
                <span className="text-gray-600">Current</span>
              </div>
            </div>
            
            {/* Submit Test Button for Mobile */}
            <button
              onClick={() => setShowSubmitModal(true)}
              className="w-full btn-primary py-2.5 sm:py-3 text-base sm:text-lg font-bold shadow-lg mt-4"
              disabled={submitting}
            >
              Submit Test
            </button>
          </div>

          {/* Section Navigation - Always visible */}
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {uniqueSections.map((sectionName) => {
                const stats = getSectionStats(sectionName);
                const isCurrentSection = currentQ?.section === sectionName;
                return (
                  <button
                    key={sectionName}
                    onClick={() => jumpToSection(sectionName)}
                    className={`px-3 py-1.5 sm:px-5 sm:py-2 rounded-full border text-xs sm:text-sm font-semibold shadow transition-all
                      ${isCurrentSection
                        ? 'border-primary-500 bg-primary-100 text-primary-700 scale-105'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-primary-50 hover:border-primary-200'
                      }`}
                  >
                    {sectionName} <span className="ml-1 sm:ml-2 text-xs text-gray-500">({stats.answered}/{stats.total})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8 mb-6 animate-fade-in">
            <div className="flex flex-wrap justify-between items-start gap-2 mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Question {currentIndex + 1}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {currentQ?.section}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {currentQ?.difficulty}
                  </span>
                  <span className="text-xs text-gray-600">{currentQ?.marks} marks</span>
                  {currentQ?.negativeMarks > 0 && (
                    <span className="text-xs text-red-600">-{currentQ.negativeMarks} for wrong answer</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => toggleMarkForReview(currentQ._id)}
                className={`flex items-center px-2 py-1 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium shadow transition
                  ${markedForReview[currentQ._id]
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-yellow-50'
                  }`}
              >
                <Flag className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {markedForReview[currentQ._id] ? 'Marked' : 'Mark'}
              </button>
            </div>

            {/* Question Text */}
            <div className="text-gray-900 mb-4 sm:mb-6 leading-relaxed text-base sm:text-lg">
              {currentQ.questionHtml ? (
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={createSanitizedHtml(currentQ.questionHtml)}
                />
              ) : (
                <p className="font-medium">
                  {currentQ.questionText.split('\n').map((line, index) => (
                    <span key={index}>
                      {line}
                      <br />
                    </span>
                  ))}
                </p>
              )}
            </div>

            {/* Question Image */}
            {currentQ.imageUrl && (
              <div className="mb-4 sm:mb-6">
                <img 
                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${currentQ.imageUrl}`}
                  alt="Question" 
                  style={{
                    width: currentQ.imageWidth ? `${currentQ.imageWidth}%` : '100%',
                    height: 'auto',
                    maxWidth: '100%'
                  }}
                  className="rounded-lg border-2 border-gray-200 shadow-md"
                />
              </div>
            )}

            <div className="space-y-2 sm:space-y-3">
              {currentQ.options.map((opt, i) => {
                const isSelected = currentQ.questionType === 'multiple' 
                  ? (answers[currentQ._id] || []).includes(opt.text)
                  : answers[currentQ._id] === opt.text;
                  
                return (
                  <label
                    key={i}
                    className={`flex items-start p-3 sm:p-4 border rounded-xl cursor-pointer transition-all shadow-sm
                      ${isSelected
                        ? "border-primary-500 bg-primary-50 scale-[1.02]"
                        : "border-gray-200 hover:border-primary-300 hover:bg-primary-50/30"
                      }`}
                  >
                    <input
                      type={currentQ.questionType === 'multiple' ? "checkbox" : "radio"}
                      name={`q-${currentQ._id}`}
                      checked={isSelected}
                      onChange={() => handleAnswer(currentQ._id, opt)}
                      className="mr-2 sm:mr-3 accent-primary-600 w-4 h-4 mt-1"
                    />
                    <div className="text-gray-800 text-sm sm:text-base flex-1">
                      <span className="font-semibold mr-1 sm:mr-2">{String.fromCharCode(65 + i)}.</span>
                      {opt.html ? (
                        <div 
                          className="inline prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={createSanitizedHtml(opt.html)}
                        />
                      ) : (
                        <span>{opt.text}</span>
                      )}
                      {opt.imageUrl && (
                        <div className="mt-2">
                          <img 
                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${opt.imageUrl}`}
                            alt={`Option ${String.fromCharCode(65 + i)}`}
                            style={{
                              width: opt.imageWidth ? `${opt.imageWidth}%` : '50%',
                              height: 'auto',
                              maxWidth: '100%'
                            }}
                            className="rounded border border-gray-300"
                          />
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex flex-wrap justify-between items-center gap-3 sm:gap-4">
            <button
              onClick={() => setCurrentIndex((i) => Math.max(i - 1, 0))}
              disabled={currentIndex === 0}
              className="btn-secondary flex items-center disabled:opacity-50 text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2"
            >
              <ChevronLeft className="w-4 h-4 mr-1 sm:mr-2" />
              Previous
            </button>
            <div className="flex flex-wrap gap-2 sm:gap-3">
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
                className="btn-secondary text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2"
              >
                Clear
              </button>
              <button
                onClick={() => {
                  if (answers[currentQ._id]) saveAnswersToServer();
                  setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));
                }}
                disabled={currentIndex === questions.length - 1}
                className="btn-primary flex items-center text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2"
              >
                Save & Next
                <ChevronRight className="w-4 h-4 ml-1 sm:ml-2" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:block w-[320px] min-w-[260px] bg-white/90 border-l rounded-2xl shadow-xl p-4 sm:p-6 sticky top-24 self-start animate-fade-in">
          <h3 className="text-base sm:text-lg font-bold text-primary-700 mb-3 sm:mb-4">Question Navigator</h3>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6 text-xs sm:text-sm">
            <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
              <div className="font-semibold text-green-800">{answeredCount}</div>
              <div className="text-green-600">Answered</div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-yellow-50 rounded-lg">
              <div className="font-semibold text-yellow-800">{reviewCount}</div>
              <div className="text-yellow-600">Review</div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
              <div className="font-semibold text-gray-800">{questions.length - answeredCount}</div>
              <div className="text-gray-600">Unanswered</div>
            </div>
          </div>
          {/* Section-wise Progress */}
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            {uniqueSections.map((sectionName) => {
              const stats = getSectionStats(sectionName);
              const sectionQuestions = getSectionQuestions(sectionName);
              const startIndex = questions.findIndex(q => q.section === sectionName);
              return (
                <div key={sectionName} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">{sectionName}</h4>
                    <span className="text-xs text-gray-600">{stats.answered}/{stats.total}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {sectionQuestions.map((q, idx) => {
                      const globalIndex = startIndex + idx;
                      const status = getQuestionStatus(q._id);
                      return (
                        <button
                          key={q._id}
                          onClick={() => setCurrentIndex(globalIndex)}
                          className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded text-xs font-bold transition-all
                            ${currentIndex === globalIndex
                              ? "bg-primary-600 text-white scale-110"
                              : status === 'answered'
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : status === 'review'
                              ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                        >
                          {idx + 1}
                          {status === 'review' && (
                            <Flag className="absolute -top-1 -right-1 w-2 h-2 text-yellow-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div className="space-y-2 text-xs mb-4 sm:mb-6">
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
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-primary-600 rounded"></div>
              <span className="text-gray-600">Current Question</span>
            </div>
          </div>
          {/* Submit Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="w-full btn-primary py-2 sm:py-3 text-base sm:text-lg font-bold shadow-lg"
            disabled={submitting}
          >
            Submit Test
          </button>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-4 sm:p-8 w-full max-w-2xl shadow-xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center mb-3 sm:mb-4">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 mr-2 sm:mr-3" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Submit Test?</h3>
            </div>
            <div className="mb-4 sm:mb-6">
              <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">
                Are you sure you want to submit your mock test? You cannot change your answers after submission.
              </p>
              {/* Warning about one attempt */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-red-700 text-xs sm:text-sm">
                    <strong>Important:</strong> This mock test allows only one attempt. Once submitted, you won't be able to retake it.
                  </p>
                </div>
              </div>
              {/* Overall Summary */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                <h4 className="font-medium text-gray-900 text-sm sm:text-base">Overall Summary</h4>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
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
                </div>
              </div>
              {/* Section-wise Summary */}
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Section-wise Summary</h4>
                <div className="space-y-1.5 sm:space-y-2">
                  {uniqueSections.map((sectionName) => {
                    const stats = getSectionStats(sectionName);
                    return (
                      <div key={sectionName} className="flex items-center justify-between text-xs sm:text-sm">
                        <span className="font-medium">{sectionName}</span>
                        <span className="text-gray-600">
                          {stats.answered}/{stats.total} answered
                          {stats.reviewed > 0 && `, ${stats.reviewed} for review`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4">
                <span>Time Remaining:</span>
                <span className="font-medium text-blue-600">{formatTime(timeLeft)}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 btn-secondary text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2"
                disabled={submitting}
              >
                Continue Test
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 btn-primary text-sm sm:text-base px-3 py-2 sm:px-4 sm:py-2"
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