import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { BarChart3, CheckCircle, XCircle, Clock } from "lucide-react";
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
      showError("Failed to load attempt details");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner size="large" />;
  if (!attempt) return <div className="p-6 text-gray-600">No attempt found.</div>;

  const test = attempt.testId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {test?.title}
        </h1>
        <p className="text-gray-600">
          Company: {test?.companyId?.name || "N/A"}
        </p>
        <p className="text-sm text-gray-500">
          Attempted on: {new Date(attempt.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <BarChart3 className="w-6 h-6 text-primary-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">{attempt.score}</p>
          <p className="text-sm text-gray-500">Score</p>
        </div>
        <div className="card text-center">
          <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">{attempt.correctAnswers}</p>
          <p className="text-sm text-gray-500">Correct</p>
        </div>
        <div className="card text-center">
          <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">{attempt.incorrectAnswers}</p>
          <p className="text-sm text-gray-500">Incorrect</p>
        </div>
        <div className="card text-center">
          <Clock className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
          <p className="text-2xl font-bold">
            {attempt.actualTimeTaken || 0} min
          </p>
          <p className="text-sm text-gray-500">Time Taken</p>
        </div>
      </div>

      {/* Answers */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Your Answers
        </h2>
        <div className="space-y-4">
          {attempt.answers && attempt.answers.length > 0 ? (
            attempt.answers.map((ans, idx) => (
              <div
                key={idx}
                className="p-4 border rounded-lg bg-gray-50 space-y-2"
              >
                <p className="font-medium text-gray-900">
                  Q{idx + 1}.{" "}
                  {test.questions?.find(
                    (q) => q._id.toString() === ans.questionId.toString()
                  )?.questionText || "Question text not available"}
                </p>
                <p className="text-sm">
                  Your Answer:{" "}
                  {typeof ans.answer === "object" ? ans.answer.text : ans.answer}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-600">No answers submitted.</p>
          )}
        </div>
      </div>

      {/* Back to Results */}
      <div className="flex justify-end">
        <Link
          to="/student/results"
          className="btn-secondary"
        >
          Back to Results
        </Link>
      </div>
    </div>
  );
};

export default ResultDetail;