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
import { useResponsive } from "../../hooks/useResponsive";
import { ResponsiveContainer, ResponsiveGrid } from "../../components/ResponsiveWrapper";
import { createSanitizedHtml } from "../../utils/sanitize";
import { getImageMarginStyle, getImageStyles } from "../../utils/imageHelpers";
import { constructImageUrl } from "../../utils/imageUtils";

const ResultDetail = () => {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const { showError } = useToast();
  const { isMobile } = useResponsive();



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
    <ResponsiveContainer className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center mb-2">
            <Link
              to="/student/results"
              className="flex items-center text-gray-500 hover:text-indigo-600 transition text-sm"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span className="font-medium">Back to Results</span>
            </Link>
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
              {test?.title}
            </h1>
            {test?.companyId?.name && (
              <span className="inline-block bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-semibold mt-2 md:mt-0">
                {test.companyId.name}
              </span>
            )}
          </div>
        </header>

        {/* Main Grid: Overall Score | Performance | Section-wise */}
        <ResponsiveGrid cols={1} colsMd={3} gap={6} className="mb-6">
          {/* Score Card */}
          <div className="flex flex-col h-full">
            <ScoreCard attempt={attempt} />
          </div>
          
          {/* Performance Analysis Card */}
          <div className="flex flex-col h-full">
            <PerformanceAnalysisCard attempt={attempt} actualTime={actualTime} />
          </div>
          
          {/* Section-wise Performance Card */}
          <div className="flex flex-col h-full">
            <SectionWisePerformanceCard attempt={attempt} />
          </div>
        </ResponsiveGrid>

        {/* Detailed Answer Analysis */}
        <div className="mb-6">
          <AnswerAnalysis
            attempt={attempt}
            showAnswers={showAnswers}
            setShowAnswers={setShowAnswers}
          />
        </div>
      </div>
    </ResponsiveContainer>
  );
};

const ScoreCard = ({ attempt }) => (
  <div className="bg-white rounded-xl shadow p-5 flex flex-col items-center justify-center text-center border border-gray-100 h-full min-h-[280px]">
    <h3 className="text-base font-semibold text-gray-600 mb-3">Overall Score</h3>
    <div className="relative w-28 h-28 mb-2">
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
        <span className="text-3xl font-bold text-gray-800">
          {attempt.percentage}%
        </span>
      </div>
    </div>
    <p className="mt-2 text-gray-500 text-xs">
      Scored <span className="font-semibold">{attempt.score}</span> out of{" "}
      <span className="font-semibold">{attempt.totalMarks}</span>
    </p>
  </div>
);

const PerformanceAnalysisCard = ({ attempt, actualTime }) => (
  <div className="bg-white rounded-xl shadow p-5 border border-gray-100 h-full min-h-[280px] flex flex-col justify-between">
    <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
      <TrendingUp className="w-4 h-4 mr-2 text-indigo-500" />
      Performance Analysis
    </h3>
    <div className="space-y-2">
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
    <div className="bg-white rounded-xl shadow p-5 border border-gray-100 h-full min-h-[280px] flex items-center justify-center text-gray-400 text-sm">
      No section-wise data
    </div>
  );
  return (
    <div className="bg-white rounded-xl shadow p-5 border border-gray-100 h-full min-h-[280px] flex flex-col justify-between">
      <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
        <BarChart3 className="w-4 h-4 mr-2 text-indigo-500" />
        Section-wise Performance
      </h3>
      <div className="space-y-4">
        {attempt.sectionWiseScore.map((section, index) => {
          const percent = Math.round(
            (section.score /
              (section.totalQuestions * (section.marksPerQuestion || 1))) *
              100
          );
          return (
            <div key={index}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-700 text-sm">
                  {section.sectionName}
                </span>
                <span className="font-bold text-gray-800 text-sm">{percent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs text-gray-500 mt-1">
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
    <div className="bg-white rounded-xl shadow p-5 border border-gray-100">
      <button
        onClick={() => setShowAnswers((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition mb-2"
      >
        <span className="text-base font-bold text-gray-800 flex items-center">
          <Info className="w-5 h-5 mr-2 text-indigo-500" />
          Detailed Answer Analysis
        </span>
        {showAnswers ? (
          <ChevronUp className="w-5 h-5" />
        ) : (
          <ChevronDown className="w-5 h-5" />
        )}
      </button>
      {showAnswers && (
        <div className="mt-4 space-y-4">
          {attempt.detailedAnswers.map((answer, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-3 bg-gray-50"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-bold text-gray-800 text-sm">
                  Question {index + 1} {answer.question?.questionType === 'multiple' && '(Multiple Choice)'}
                </h4>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                    answer.isCorrect
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {answer.isCorrect ? "Correct" : "Incorrect"}
                </span>
              </div>
              
              {/* Question Text with HTML Support */}
              {answer.question?.html ? (
                <div
                  className="prose max-w-none text-gray-700 mb-3 text-sm"
                  dangerouslySetInnerHTML={createSanitizedHtml(answer.question.html)}
                />
              ) : answer.question?.text ? (
                <p
                  className="text-gray-700 mb-3 text-sm"
                  dangerouslySetInnerHTML={{ __html: answer.question.text }}
                />
              ) : null}
              
              {/* Question Image */}
              {answer.question?.imageUrl && (
                <div className="mb-3">
                  <img 
                    src={constructImageUrl(answer.question.imageUrl)}
                    alt="Question" 
                    style={getImageStyles(answer.question.imageAlign, answer.question.imageWidth, answer.question.imageHeight)}
                    className="rounded-lg border-2 border-gray-200 shadow-sm"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                {answer.question?.options?.map((option, optIndex) => {
                  // Support both text-based and index-based option identifiers
                  const optionId = option.text && option.text.trim() ? option.text : `option_${optIndex}`;
                  const isSelected = answer.selectedOptions?.includes(optionId);
                  const isCorrect = option.isCorrect;
                  
                  // Determine the styling based on correctness and selection
                  let optionClass = "bg-gray-100 border-gray-200";
                  if (isCorrect && isSelected) {
                    // Correctly selected option
                    optionClass = "bg-green-100 border-green-300 text-green-900";
                  } else if (isCorrect && !isSelected) {
                    // Missed correct option (for multiple choice)
                    optionClass = "bg-blue-100 border-blue-300 text-blue-900";
                  } else if (!isCorrect && isSelected) {
                    // Incorrectly selected option
                    optionClass = "bg-red-100 border-red-300 text-red-900";
                  }

                  return (
                    <div
                      key={optIndex}
                      className={`p-2 rounded-lg border flex flex-col text-sm ${optionClass}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start flex-1">
                          <span className="mr-2 font-semibold">{String.fromCharCode(65 + optIndex)}.</span>
                          {option.html ? (
                            <div 
                              className="prose prose-sm max-w-none flex-1"
                              dangerouslySetInnerHTML={createSanitizedHtml(option.html)}
                            />
                          ) : option.text ? (
                            <span className="flex-1">{option.text}</span>
                          ) : null}
                        </div>
                        <div className="flex items-center ml-2 flex-shrink-0">
                          {isCorrect && (
                            <span className="text-xs font-bold text-green-800 mr-2">
                              (Correct)
                            </span>
                          )}
                          {isSelected && (
                            <span className="text-xs font-bold text-indigo-800">
                              Your Answer
                            </span>
                          )}
                        </div>
                      </div>
                      {option.imageUrl && (
                        <div className="mt-2 ml-6">
                          <img 
                            src={constructImageUrl(option.imageUrl)}
                            alt={`Option ${String.fromCharCode(65 + optIndex)}`}
                            style={getImageStyles(option.imageAlign, option.imageWidth, option.imageHeight)}
                            className="rounded border border-gray-300"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Explanation with HTML Support */}
              {(answer.question?.explanationHtml || answer.question?.explanation || answer.question?.explanationImageUrl) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                  <h5 className="font-bold text-blue-900 mb-1 text-sm">Explanation:</h5>
                  {answer.question.explanationHtml ? (
                    <div 
                      className="prose prose-sm max-w-none text-blue-800"
                      dangerouslySetInnerHTML={createSanitizedHtml(answer.question.explanationHtml)}
                    />
                  ) : answer.question.explanation ? (
                    <p className="text-blue-800 text-xs">
                      {answer.question.explanation}
                    </p>
                  ) : null}
                  {answer.question.explanationImageUrl && (
                    <div className="mt-2">
                      <img 
                        src={constructImageUrl(answer.question.explanationImageUrl)}
                        alt="Explanation" 
                        style={getImageStyles(answer.question.explanationImageAlign, answer.question.explanationImageWidth, answer.question.explanationImageHeight)}
                        className="rounded-lg border border-blue-300 shadow-sm"
                      />
                    </div>
                  )}
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
  <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
    <span className={`flex items-center font-medium text-gray-600 text-sm`}>
      <Icon className={`w-4 h-4 mr-2 ${color}`} />
      {label}
    </span>
    <span className={`font-bold text-gray-800 text-sm`}>{value}</span>
  </div>
);

export default ResultDetail;