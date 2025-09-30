import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
  Award,
  TrendingUp,
  ArrowLeft,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useToast } from "../../context/ToastContext";

const ResultDetail = () => {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const { showError } = useToast();

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const res = await api.get(`/students/attempts/${attemptId}`);
        if (res.data.success) {
          setAttempt(res.data.data.attempt);
        }
      } catch (error) {
        showError(
          error.response?.data?.message || "Failed to load result details"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchAttempt();
  }, [attemptId, showError]);

  if (loading) return <LoadingSpinner size="large" />;
  if (!attempt)
    return <div className="p-6 text-center text-gray-600">Result not found.</div>;

  const test = attempt.testId;
  const actualTime =
    attempt.startTime && attempt.endTime
      ? Math.floor(
          (new Date(attempt.endTime) - new Date(attempt.startTime)) / 60000
        )
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center mb-2">
            <Link
              to="/student/results"
              className="flex items-center text-gray-500 hover:text-indigo-600 transition"
            >
              <ArrowLeft className="w-6 h-6 mr-2" />
              <span className="font-medium">Back to Results</span>
            </Link>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 tracking-tight">
              {test?.title}
            </h1>
            {test?.companyId?.name && (
              <span className="inline-block bg-indigo-100 text-indigo-800 px-4 py-1 rounded-full text-sm font-semibold mt-2 md:mt-0">
                {test.companyId.name}
              </span>
            )}
          </div>
        </header>

        {/* Main Grid: Overall Score | Performance | Section-wise */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* All three cards in a row, same height */}
          <div className="flex flex-col gap-8 h-full">
            <div className="flex flex-col h-full">
              <ScoreCard attempt={attempt} />
            </div>
          </div>
          <div className="flex flex-col gap-8 h-full">
            <div className="flex flex-col h-full">
              <PerformanceAnalysisCard attempt={attempt} actualTime={actualTime} />
            </div>
          </div>
          <div className="flex flex-col gap-8 h-full">
            <div className="flex flex-col h-full">
              <SectionWisePerformanceCard attempt={attempt} />
            </div>
          </div>
        </div>

        {/* Detailed Answer Analysis */}
        <div className="mb-8">
          <AnswerAnalysis
            attempt={attempt}
            showAnswers={showAnswers}
            setShowAnswers={setShowAnswers}
          />
        </div>
      </div>
    </div>
  );
};

const ScoreCard = ({ attempt }) => (
  <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center justify-center text-center border border-gray-100 h-full min-h-[340px]">
    <h3 className="text-lg font-semibold text-gray-600 mb-4">Overall Score</h3>
    <div className="relative w-36 h-36 mb-2">
      <svg className="w-full h-full" viewBox="0 0 36 36">
        <path
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="#e6e6e6"
          strokeWidth="3"
        />
        <path
          d="M18 2.0845
            a 15.9155 15.9155 0 0 1 0 31.831
            a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke={
            attempt.percentage > 75
              ? "#22c55e"
              : attempt.percentage > 40
              ? "#f59e0b"
              : "#ef4444"
          }
          strokeWidth="3"
          strokeDasharray={`${attempt.percentage}, 100`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-gray-800">
          {attempt.percentage}%
        </span>
      </div>
    </div>
    <p className="mt-2 text-gray-500 text-sm">
      Scored <span className="font-semibold">{attempt.score}</span> out of{" "}
      <span className="font-semibold">{attempt.totalMarks}</span>
    </p>
  </div>
);

const PerformanceAnalysisCard = ({ attempt, actualTime }) => (
  <div className="bg-white rounded-xl shadow p-6 border border-gray-100 h-full min-h-[340px] flex flex-col justify-between">
    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
      <TrendingUp className="w-5 h-5 mr-2 text-indigo-500" />
      Performance Analysis
    </h3>
    <div className="space-y-3">
      <StatRow
        icon={CheckCircle}
        label="Correct Answers"
        value={attempt.correctAnswers}
        color="text-green-600"
      />
      <StatRow
        icon={XCircle}
        label="Incorrect Answers"
        value={attempt.incorrectAnswers}
        color="text-red-600"
      />
      <StatRow
        icon={Clock}
        label="Time Taken (min)"
        value={actualTime}
        color="text-purple-600"
      />
      {attempt.rank && (
        <StatRow
          icon={Trophy}
          label="Your Rank"
          value={`#${attempt.rank}`}
          color="text-blue-600"
        />
      )}
      {attempt.percentile && (
        <StatRow
          icon={Award}
          label="Percentile"
          value={`${attempt.percentile}%`}
          color="text-yellow-600"
        />
      )}
    </div>
  </div>
);

const SectionWisePerformanceCard = ({ attempt }) => {
  if (!attempt.sectionWiseScore?.length) return (
    <div className="bg-white rounded-xl shadow p-6 border border-gray-100 h-full min-h-[340px] flex items-center justify-center text-gray-400">
      No section-wise data
    </div>
  );
  return (
    <div className="bg-white rounded-xl shadow p-6 border border-gray-100 h-full min-h-[340px] flex flex-col justify-between">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <BarChart3 className="w-5 h-5 mr-2 text-indigo-500" />
        Section-wise Performance
      </h3>
      <div className="space-y-5">
        {attempt.sectionWiseScore.map((section, index) => {
          const percent = Math.round(
            (section.score /
              (section.totalQuestions * (section.marksPerQuestion || 1))) *
              100
          );
          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-700">
                  {section.sectionName}
                </span>
                <span className="font-bold text-gray-800">{percent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-indigo-400 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mt-1">
                <div>
                  Correct:{" "}
                  <span className="font-semibold text-green-600">
                    {section.correctAnswers}
                  </span>
                </div>
                <div>
                  Total:{" "}
                  <span className="font-semibold">
                    {section.totalQuestions}
                  </span>
                </div>
                <div>
                  Attempted:{" "}
                  <span className="font-semibold">
                    {section.attemptedQuestions}
                  </span>
                </div>
                <div>
                  Time:{" "}
                  <span className="font-semibold">{section.timeSpent} min</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AnswerAnalysis = ({ attempt, showAnswers, setShowAnswers }) => {
  if (!attempt.detailedAnswers?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
      <button
        onClick={() => setShowAnswers((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition mb-2"
      >
        <span className="text-lg font-bold text-gray-800 flex items-center">
          <Info className="w-6 h-6 mr-2 text-indigo-500" />
          Detailed Answer Analysis
        </span>
        {showAnswers ? (
          <ChevronUp className="w-6 h-6" />
        ) : (
          <ChevronDown className="w-6 h-6" />
        )}
      </button>
      {showAnswers && (
        <div className="mt-6 space-y-6">
          {attempt.detailedAnswers.map((answer, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-bold text-gray-800">
                  Question {index + 1}
                </h4>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    answer.isCorrect
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {answer.isCorrect ? "Correct" : "Incorrect"}
                </span>
              </div>
              <p
                className="text-gray-700 mb-4"
                dangerouslySetInnerHTML={{ __html: answer.question?.text }}
              />
              <div className="space-y-2">
                {answer.question?.options?.map((option, optIndex) => {
                  const isSelected = answer.selectedOptions.includes(option.text);
                  const isCorrect = option.isCorrect;
                  let optionClass = "bg-gray-100 border-gray-200";
                  if (isCorrect)
                    optionClass = "bg-green-100 border-green-300 text-green-900";
                  else if (isSelected && !isCorrect)
                    optionClass = "bg-red-100 border-red-300 text-red-900";

                  return (
                    <div
                      key={optIndex}
                      className={`p-3 rounded-lg border flex items-center justify-between ${optionClass}`}
                    >
                      <span>{option.text}</span>
                      {isSelected && (
                        <span className="text-xs font-bold text-indigo-800">
                          Your Answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              {answer.question?.explanation && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <h5 className="font-bold text-blue-900 mb-1">Explanation:</h5>
                  <p className="text-blue-800 text-sm">
                    {answer.question.explanation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StatRow = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
    <span className={`flex items-center font-medium text-gray-600`}>
      <Icon className={`w-5 h-5 mr-3 ${color}`} />
      {label}
    </span>
    <span className={`font-bold text-gray-800`}>{value}</span>
  </div>
);

export default ResultDetail;