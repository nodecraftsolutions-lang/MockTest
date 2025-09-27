import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  BarChart3, CheckCircle, XCircle, Clock, Trophy,
  Award, TrendingUp, ArrowLeft
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

  if (loading) return <LoadingSpinner size="large" />;
  if (!attempt) return <div className="p-6 text-gray-600">Result not found.</div>;

  const test = attempt.testId;
  const actualTime = attempt.startTime && attempt.endTime
    ? Math.floor((new Date(attempt.endTime) - new Date(attempt.startTime)) / 60000)
    : 0;

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
      </div>

      {/* Result Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard icon={BarChart3} color="bg-blue-100 text-blue-600" value={`${attempt.percentage}%`} label="Overall Score" />
        <SummaryCard icon={CheckCircle} color="bg-green-100 text-green-600" value={attempt.correctAnswers} label="Correct Answers" />
        <SummaryCard icon={XCircle} color="bg-red-100 text-red-600" value={attempt.incorrectAnswers} label="Incorrect Answers" />
        <SummaryCard icon={Clock} color="bg-purple-100 text-purple-600" value={actualTime} label="Minutes Taken" />
      </div>

      {/* Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overall Performance */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Analysis</h3>
          <div className="space-y-4">
            <StatRow label="Total Questions" value={attempt.totalQuestions} />
            <StatRow label="Correct Answers" value={attempt.correctAnswers} color="text-green-700" />
            <StatRow label="Incorrect Answers" value={attempt.incorrectAnswers} color="text-red-700" />
            <StatRow label="Unanswered" value={attempt.unansweredQuestions} color="text-yellow-700" />

            {attempt.rank && <StatRow icon={Trophy} label="Your Rank" value={`#${attempt.rank}`} />}
            {attempt.percentile && <StatRow icon={Award} label="Percentile" value={`${attempt.percentile}%`} />}
          </div>
        </div>

        {/* Section-wise Performance */}
        {attempt.sectionWiseScore?.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Section-wise Performance</h3>
            <div className="space-y-3">
              {attempt.sectionWiseScore.map((section, index) => {
                const percent = Math.round(
                  (section.score / (section.totalQuestions * (section.marksPerQuestion || 1))) * 100
                );
                return (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{section.sectionName}</h4>
                      <span className="text-lg font-bold text-primary-600">{percent}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>Correct: <span className="font-medium text-green-600">{section.correctAnswers}</span></div>
                      <div>Total: <span className="font-medium">{section.totalQuestions}</span></div>
                      <div>Attempted: <span className="font-medium">{section.attemptedQuestions}</span></div>
                      <div>Time: <span className="font-medium">{section.timeSpent} min</span></div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${percent}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Detailed Answer Analysis */}
      {attempt.detailedAnswers?.length > 0 && (
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
                    <div key={optIndex}
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
                          {option.isCorrect && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Correct</span>}
                          {answer.selectedOptions.includes(option.text) && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Your Answer</span>}
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
    </div>
  );
};

const SummaryCard = ({ icon: Icon, color, value, label }) => (
  <div className="card text-center">
    <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-3xl font-bold">{value}</p>
    <p className="text-sm text-gray-600">{label}</p>
  </div>
);

const StatRow = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <span className={`${color || 'text-gray-600'} flex items-center`}>
      {Icon && <Icon className="w-4 h-4 mr-2" />}
      {label}
    </span>
    <span className="font-semibold">{value}</span>
  </div>
);

export default ResultDetail;
