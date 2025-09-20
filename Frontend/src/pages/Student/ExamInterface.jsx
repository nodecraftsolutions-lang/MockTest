import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Flag, Save, Send, AlertTriangle } from 'lucide-react';
import io from 'socket.io-client';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import Cookies from 'js-cookie';

const ExamInterface = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess, showWarning } = useToast();
  
  const [examData, setExamData] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [violations, setViolations] = useState(0);
  
  const socketRef = useRef(null);
  const timerRef = useRef(null);
  const lastSaveRef = useRef(Date.now());

  useEffect(() => {
    initializeExam();
    setupSocketConnection();
    setupExamMonitoring();
    
    return () => {
      cleanup();
    };
  }, [attemptId]);

  const initializeExam = async () => {
    try {
      const token = Cookies.get('token');
      const response = await api.get(`/tests/${attemptId}/questions?attemptId=${attemptId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const { questions, sections, instructions, savedAnswers } = response.data.data;
        setExamData({ questions, sections, instructions });
        
        // Load saved answers
        const answersMap = {};
        const reviewSet = new Set();
        savedAnswers.forEach(answer => {
          answersMap[answer.questionId] = answer.selectedOptions;
          if (answer.isMarkedForReview) {
            reviewSet.add(answer.questionId);
          }
        });
        setAnswers(answersMap);
        setMarkedForReview(reviewSet);
      }
    } catch (error) {
      showError('Failed to load exam questions');
      navigate('/student/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const setupSocketConnection = () => {
    const token = Cookies.get('token');
    socketRef.current = io('http://localhost:5000/exam', {
      auth: { token }
    });

    socketRef.current.emit('joinAttempt', { attemptId });

    socketRef.current.on('attemptJoined', (data) => {
      setTimeRemaining(data.timeRemaining);
      startTimer();
    });

    socketRef.current.on('timeSync', (data) => {
      setTimeRemaining(data.timeRemaining);
    });

    socketRef.current.on('answerSaved', (data) => {
      if (data.success) {
        lastSaveRef.current = Date.now();
      }
    });

    socketRef.current.on('violationWarning', (data) => {
      setViolations(data.violationCount);
      showWarning(data.message);
    });

    socketRef.current.on('attemptExpired', () => {
      showError('Time expired! Exam submitted automatically.');
      navigate('/student/results');
    });

    socketRef.current.on('forceSubmit', () => {
      showError('Exam submitted due to violations.');
      navigate('/student/results');
    });

    socketRef.current.on('autoSubmit', () => {
      showWarning('Time expired! Exam submitted automatically.');
      navigate('/student/results');
    });
  };

  const setupExamMonitoring = () => {
    // Prevent right-click
    document.addEventListener('contextmenu', handleRightClick);
    
    // Detect tab switching
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Detect window blur
    window.addEventListener('blur', handleWindowBlur);
    
    // Prevent copy-paste
    document.addEventListener('keydown', handleKeyDown);
    
    // Detect developer tools (basic detection)
    setInterval(detectDevTools, 1000);
  };

  const handleRightClick = (e) => {
    e.preventDefault();
    reportViolation('right-click', 'Right-click detected');
  };

  const handleVisibilityChange = () => {
    if (document.hidden) {
      reportViolation('tab-switch', 'Tab switched or window minimized');
    }
  };

  const handleWindowBlur = () => {
    reportViolation('window-blur', 'Window lost focus');
  };

  const handleKeyDown = (e) => {
    // Prevent common copy-paste shortcuts
    if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
      e.preventDefault();
      reportViolation('copy-paste', `${e.key.toUpperCase()} key combination blocked`);
    }
    
    // Prevent F12 and other dev tools shortcuts
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.shiftKey && e.key === 'C')) {
      e.preventDefault();
      reportViolation('developer-tools', 'Developer tools access attempted');
    }
  };

  const detectDevTools = () => {
    const threshold = 160;
    if (window.outerHeight - window.innerHeight > threshold || 
        window.outerWidth - window.innerWidth > threshold) {
      reportViolation('developer-tools', 'Developer tools possibly opened');
    }
  };

  const reportViolation = (type, details) => {
    if (socketRef.current) {
      socketRef.current.emit('examViolation', {
        attemptId,
        violationType: type,
        details
      });
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const saveAnswer = (questionId, selectedOptions, isReview = false) => {
    const newAnswers = { ...answers, [questionId]: selectedOptions };
    setAnswers(newAnswers);

    if (isReview) {
      const newReviewSet = new Set(markedForReview);
      if (newReviewSet.has(questionId)) {
        newReviewSet.delete(questionId);
      } else {
        newReviewSet.add(questionId);
      }
      setMarkedForReview(newReviewSet);
    }

    // Auto-save every 20 seconds or on answer change
    const now = Date.now();
    if (now - lastSaveRef.current > 20000 || selectedOptions.length > 0) {
      if (socketRef.current) {
        socketRef.current.emit('saveAnswer', {
          attemptId,
          questionId,
          selectedOptions,
          isMarkedForReview: markedForReview.has(questionId),
          section: examData.questions[currentQuestion]?.section
        });
      }
    }
  };

  const handleAnswerChange = (optionIndex) => {
    const question = examData.questions[currentQuestion];
    const questionId = question._id;
    
    let selectedOptions = answers[questionId] || [];
    
    if (question.questionType === 'single') {
      selectedOptions = [optionIndex];
    } else {
      if (selectedOptions.includes(optionIndex)) {
        selectedOptions = selectedOptions.filter(opt => opt !== optionIndex);
      } else {
        selectedOptions = [...selectedOptions, optionIndex];
      }
    }
    
    saveAnswer(questionId, selectedOptions);
  };

  const handleMarkForReview = () => {
    const questionId = examData.questions[currentQuestion]._id;
    saveAnswer(questionId, answers[questionId] || [], true);
  };

  const handleClearAnswer = () => {
    const questionId = examData.questions[currentQuestion]._id;
    saveAnswer(questionId, []);
  };

  const handleSubmit = async () => {
    if (window.confirm('Are you sure you want to submit the exam? This action cannot be undone.')) {
      setSubmitting(true);
      
      try {
        if (socketRef.current) {
          socketRef.current.emit('submitAttempt', { attemptId });
        }
        
        showSuccess('Exam submitted successfully!');
        navigate('/student/results');
      } catch (error) {
        showError('Failed to submit exam');
        setSubmitting(false);
      }
    }
  };

  const handleAutoSubmit = () => {
    if (socketRef.current) {
      socketRef.current.emit('submitAttempt', { attemptId });
    }
  };

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    // Remove event listeners
    document.removeEventListener('contextmenu', handleRightClick);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', handleWindowBlur);
    document.removeEventListener('keydown', handleKeyDown);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (index) => {
    const questionId = examData.questions[index]._id;
    const hasAnswer = answers[questionId] && answers[questionId].length > 0;
    const isReviewed = markedForReview.has(questionId);
    
    if (isReviewed && hasAnswer) return 'answered-review';
    if (isReviewed) return 'review';
    if (hasAnswer) return 'answered';
    return 'unanswered';
  };

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  if (!examData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Exam Not Found</h2>
          <p className="text-gray-600 mb-4">The exam session could not be loaded.</p>
          <button onClick={() => navigate('/student/dashboard')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQ = examData.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-gray-900">Mock Test</h1>
            <div className="text-sm text-gray-600">
              Question {currentQuestion + 1} of {examData.questions.length}
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            {violations > 0 && (
              <div className="flex items-center text-red-600">
                <AlertTriangle className="w-4 h-4 mr-1" />
                <span className="text-sm">{violations} violation(s)</span>
              </div>
            )}
            
            <div className="flex items-center text-primary-600">
              <Clock className="w-5 h-5 mr-2" />
              <span className="text-lg font-mono font-semibold">
                {formatTime(timeRemaining)}
              </span>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Question Palette */}
        <div className="w-80 bg-white shadow-sm border-r border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Question Palette</h3>
          
          <div className="grid grid-cols-5 gap-2 mb-6">
            {examData.questions.map((_, index) => {
              const status = getQuestionStatus(index);
              const isActive = index === currentQuestion;
              
              return (
                <button
                  key={index}
                  onClick={() => setCurrentQuestion(index)}
                  className={`w-10 h-10 rounded text-sm font-medium border-2 transition-colors ${
                    isActive 
                      ? 'border-primary-500 bg-primary-100 text-primary-700'
                      : status === 'answered-review'
                      ? 'border-purple-300 bg-purple-100 text-purple-700'
                      : status === 'review'
                      ? 'border-yellow-300 bg-yellow-100 text-yellow-700'
                      : status === 'answered'
                      ? 'border-green-300 bg-green-100 text-green-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
              <span>Answered</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded mr-2"></div>
              <span>Marked for Review</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-100 border border-purple-300 rounded mr-2"></div>
              <span>Answered & Reviewed</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-white border border-gray-300 rounded mr-2"></div>
              <span>Not Answered</span>
            </div>
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            {/* Question */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      {currentQ.section}
                    </span>
                    <span className="text-sm text-gray-400">•</span>
                    <span className="text-sm text-gray-600">
                      {currentQ.marks} mark(s)
                    </span>
                  </div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Q{currentQuestion + 1}. {currentQ.questionText}
                  </h2>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQ.options.map((option, index) => {
                  const isSelected = answers[currentQ._id]?.includes(index);
                  const inputType = currentQ.questionType === 'single' ? 'radio' : 'checkbox';
                  
                  return (
                    <label
                      key={index}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type={inputType}
                        name={`question-${currentQ._id}`}
                        checked={isSelected}
                        onChange={() => handleAnswerChange(index)}
                        className="mr-3"
                      />
                      <span className="text-gray-900">{option.text}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-3">
                <button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="btn-secondary disabled:opacity-50"
                >
                  Previous
                </button>
                
                <button
                  onClick={handleClearAnswer}
                  className="btn-secondary"
                >
                  Clear Answer
                </button>
                
                <button
                  onClick={handleMarkForReview}
                  className={`btn-secondary flex items-center ${
                    markedForReview.has(currentQ._id) ? 'bg-yellow-100 text-yellow-700' : ''
                  }`}
                >
                  <Flag className="w-4 h-4 mr-2" />
                  {markedForReview.has(currentQ._id) ? 'Unmark' : 'Mark for Review'}
                </button>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    // Auto-save current answer
                    const questionId = currentQ._id;
                    if (socketRef.current) {
                      socketRef.current.emit('saveAnswer', {
                        attemptId,
                        questionId,
                        selectedOptions: answers[questionId] || [],
                        isMarkedForReview: markedForReview.has(questionId),
                        section: currentQ.section
                      });
                    }
                  }}
                  className="btn-secondary flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </button>
                
                <button
                  onClick={() => setCurrentQuestion(Math.min(examData.questions.length - 1, currentQuestion + 1))}
                  disabled={currentQuestion === examData.questions.length - 1}
                  className="btn-primary disabled:opacity-50"
                >
                  {currentQuestion === examData.questions.length - 1 ? 'Review' : 'Save & Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamInterface;