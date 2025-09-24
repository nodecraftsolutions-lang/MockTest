import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  BarChart3, CheckCircle, XCircle, Clock, Trophy, 
  Award, TrendingUp, Download, ArrowLeft 
} from "lucide-react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useToast } from "../../context/ToastContext";

const ResultDetail = () => {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    fetchAttempt();
  }, [attemptId]);

  const fetchAttempt = async () => {
    try {
      const res = await api.get(`/students/attempts/${attemptId}`);
      if (res.data.success) {
        setAttempt(res.data.data.attempt);
      }
    } catch (error) {
      showError(error.response?.data?.message || "Failed to load result details");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await api.get(`/students/attempts/${attemptId}/download`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `result-${attemptId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showError('Failed to download report');
    }
  };

  if (loading) return <LoadingSpinner size="large" />;
  if (!attempt) return <div className="p-6 text-gray-600">Result not found.</div>;

  const test = attempt.testId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/student/results" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Test Result</h1>
            <p className="text-gray-600">{test?.title} - {test?.companyId?.name}</p>
          </div>
        </div>
        
        <button
          onClick={downloadReport}
          className="btn-secondary flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Report
        </button>
      </div>

      {/* Result Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-blue-600">{attempt.score}%</p>
          <p className="text-sm text-gray-600">Overall Score</p>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-green-600">{attempt.correctAnswers}</p>
          <p className="text-sm text-gray-600">Correct Answers</p>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-red-600">{attempt.incorrectAnswers}</p>
          <p className="text-sm text-gray-600">Incorrect Answers</p>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-3xl font-bold text-purple-600">{attempt.actualTimeTaken || 0}</p>
          <p className="text-sm text-gray-600">Minutes Taken</p>
        </div>
      </div>

      {/* Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Performance */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Analysis</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Questions</span>
              <span className="font-semibold">{attempt.totalQuestions}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-green-700">Correct Answers</span>
              <span className="font-semibold text-green-800">{attempt.correctAnswers}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-red-700">Incorrect Answers</span>
              <span className="font-semibold text-red-800">{attempt.incorrectAnswers}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="text-yellow-700">Unanswered</span>
              <span className="font-semibold text-yellow-800">{attempt.unansweredQuestions}</span>
            </div>
            
            {attempt.rank && (
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-purple-700 flex items-center">
                  <Trophy className="w-4 h-4 mr-2" />
                  Your Rank
                </span>
                <span className="font-semibold text-purple-800">#{attempt.rank}</span>
              </div>
            )}
            
            {attempt.percentile && (
              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                <span className="text-indigo-700 flex items-center">
                  <Award className="w-4 h-4 mr-2" />
                  Percentile
                </span>
                <span className="font-semibold text-indigo-800">{attempt.percentile}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Section-wise Performance */}
        {attempt.sectionWiseScore && attempt.sectionWiseScore.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Section-wise Performance</h3>
            
            <div className="space-y-3">
              {attempt.sectionWiseScore.map((section, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{section.sectionName}</h4>
                    <span className="text-lg font-bold text-primary-600">{section.score}%</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <span>Correct: </span>
                      <span className="font-medium text-green-600">{section.correctAnswers}</span>
                    </div>
                    <div>
                      <span>Total: </span>
                      <span className="font-medium">{section.totalQuestions}</span>
                    </div>
                    <div>
                      <span>Attempted: </span>
                      <span className="font-medium">{section.attemptedQuestions}</span>
                    </div>
                    <div>
                      <span>Time: </span>
                      <span className="font-medium">{section.timeSpent}min</span>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full" 
                        style={{ width: `${section.score}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Answer Analysis */}
      {attempt.detailedAnswers && attempt.detailedAnswers.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Answer Analysis</h3>
          
          <div className="space-y-4">
            {attempt.detailedAnswers.map((answer, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {answer.isCorrect ? 'Correct' : 'Incorrect'}
                  </span>
                </div>
                
                <p className="text-gray-800 mb-3">{answer.question?.text}</p>
                
                <div className="space-y-2 mb-3">
                  {answer.question?.options?.map((option, optIndex) => (
                    <div 
                      key={optIndex}
                      className={`p-2 rounded border ${
                        option.isCorrect 
                          ? 'bg-green-50 border-green-200 text-green-800'
                          : answer.selectedOptions.includes(option.text)
                          ? 'bg-red-50 border-red-200 text-red-800'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option.text}</span>
                        <div className="flex items-center space-x-2">
                          {option.isCorrect && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Correct Answer
                            </span>
                          )}
                          {answer.selectedOptions.includes(option.text) && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Your Answer
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {answer.question?.explanation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h5 className="font-medium text-blue-900 mb-1">Explanation:</h5>
                    <p className="text-blue-800 text-sm">{answer.question.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Test Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Test Name</label>
              <p className="text-gray-900">{test?.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Company</label>
              <p className="text-gray-900">{test?.companyId?.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Test Type</label>
              <p className="text-gray-900 capitalize">{test?.type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Difficulty</label>
              <p className="text-gray-900">{test?.difficulty}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Start Time</label>
              <p className="text-gray-900">{new Date(attempt.startTime).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">End Time</label>
              <p className="text-gray-900">
                {attempt.endTime ? new Date(attempt.endTime).toLocaleString() : 'Not completed'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Duration</label>
              <p className="text-gray-900">{attempt.duration} minutes</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                attempt.isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {attempt.isPassed ? 'Passed' : 'Failed'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Strengths</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              {attempt.sectionWiseScore?.filter(s => s.score >= 70).map((section, index) => (
                <li key={index} className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Strong performance in {section.sectionName} ({section.score}%)
                </li>
              ))}
              {attempt.correctAnswers > attempt.incorrectAnswers && (
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Good accuracy rate
                </li>
              )}
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Areas for Improvement</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              {attempt.sectionWiseScore?.filter(s => s.score < 50).map((section, index) => (
                <li key={index} className="flex items-center">
                  <XCircle className="w-4 h-4 text-red-500 mr-2" />
                  Focus more on {section.sectionName} ({section.score}%)
                </li>
              ))}
              {attempt.unansweredQuestions > 5 && (
                <li className="flex items-center">
                  <XCircle className="w-4 h-4 text-red-500 mr-2" />
                  Work on time management - {attempt.unansweredQuestions} questions unanswered
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultDetail;