import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Clock, FileText, CheckCircle, Play, Lock, Loader2 } from "lucide-react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useToast } from "../../context/ToastContext";

const CompanyDetails = () => {
  const { companyId } = useParams();
  const [company, setCompany] = useState(null);
  const [pattern, setPattern] = useState(null);
  const [tests, setTests] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [companyRes, testsRes, patternRes, enrollRes] = await Promise.all([
        api.get(`/companies/${companyId}`),
        api.get(`/tests?companyId=${companyId}`),
        api.get(`/companies/${companyId}/pattern`),
        api.get(`/enrollments/company/${companyId}/status`),
      ]);

      setCompany(companyRes.data.data.company);
      setTests(testsRes.data.data.tests || []);
      setPattern(patternRes.data.data);
      setIsEnrolled(enrollRes.data.data.isEnrolled);
    } catch (error) {
      showError("Failed to load company details");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      const res = await api.post(`/enrollments/company/${companyId}`);
      if (res.data.success) {
        showSuccess("Enrolled successfully! Paid tests unlocked.");
        setIsEnrolled(true);
      }
    } catch (error) {
      showError(error.response?.data?.message || "Failed to enroll");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
      </div>
    );

  const freeTests = tests.filter((t) => t.type === "free");
  const paidTests = tests.filter((t) => t.type === "paid");

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-10 animate-fade-in">
      {/* Company Header */}
      <div className="flex items-center gap-6 bg-white rounded-2xl shadow-xl p-8 mb-2 transition hover:shadow-2xl animate-fade-in">
        {company?.logoUrl ? (
          <img
            src={company.logoUrl}
            alt={company.name}
            className="w-20 h-20 object-contain rounded-full shadow-lg border border-primary-100 bg-white"
          />
        ) : (
          <div className="w-20 h-20 flex items-center justify-center bg-primary-50 rounded-full shadow-lg border border-primary-100">
            <FileText className="w-10 h-10 text-primary-600" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1 tracking-tight">
            {company?.name}
          </h1>
          <p className="text-gray-600 text-lg">{company?.description}</p>
        </div>
      </div>

      {/* Exam Pattern */}
      {pattern && (
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8 transition hover:shadow-2xl animate-fade-in">
          <h2 className="text-2xl font-bold text-primary-700 mb-6 flex items-center gap-2">
            <FileText className="w-7 h-7 text-primary-600" />
            {company?.name} Exam Pattern
          </h2>
          {/* Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-6 bg-blue-50 rounded-xl shadow hover:scale-105 transition animate-fade-in">
              <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-blue-600">
                {pattern.totalQuestions}
              </div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
            <div className="text-center p-6 bg-green-50 rounded-xl shadow hover:scale-105 transition animate-fade-in">
              <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-green-600">
                {pattern.totalDuration} min
              </div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-xl shadow hover:scale-105 transition animate-fade-in">
              <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-3xl font-bold text-purple-600">
                {pattern.cutoffPercentage}%
              </div>
              <div className="text-sm text-gray-600">Passing Criteria</div>
            </div>
          </div>
          {/* Section Breakdown */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-3">
              Section-wise Breakdown
            </h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 rounded-xl overflow-hidden shadow">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Questions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Marks per Question
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pattern.pattern.map((section, index) => (
                    <tr key={index} className="hover:bg-primary-50 transition">
                      <td className="px-6 py-4">{section.sectionName}</td>
                      <td className="px-6 py-4">{section.questions}</td>
                      <td className="px-6 py-4">{section.duration} min</td>
                      <td className="px-6 py-4">
                        {section.marksPerQuestion || 1}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Available Tests */}
      <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8 transition hover:shadow-2xl animate-fade-in">
        <h2 className="text-2xl font-bold text-primary-700 mb-6 flex items-center gap-2">
          <Play className="w-7 h-7 text-primary-600" />
          Available Tests
        </h2>

        {/* Free Tests */}
        {freeTests.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Free Tests
            </h3>
            <div className="grid md:grid-cols-2 gap-5">
              {freeTests.map((test, idx) => (
                <div
                  key={test._id}
                  className="flex items-center justify-between p-5 border border-primary-100 rounded-xl bg-primary-50/60 hover:shadow-lg transition animate-fade-in"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div>
                    <p className="font-medium text-gray-900 text-lg">{test.title}</p>
                    <p className="text-sm text-primary-600">Free Test</p>
                  </div>
                  <Link
                    to={`/student/exam/${test._id}`}
                    className="btn-primary flex items-center gap-2 px-5 py-2 rounded-full shadow hover:scale-105 transition"
                  >
                    <Play className="w-4 h-4" />
                    Take Test
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Paid Tests */}
        {paidTests.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Paid Tests</h3>
              {!isEnrolled && (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="btn-primary px-6 py-2 rounded-full shadow hover:scale-105 transition"
                >
                  {enrolling ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Enrolling...
                    </span>
                  ) : (
                    <>
                      Enroll Now • ₹
                      {paidTests.reduce((sum, t) => sum + t.price, 0)}
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {paidTests.map((test, idx) => (
                <div
                  key={test._id}
                  className="flex items-center justify-between p-5 border border-primary-100 rounded-xl bg-primary-50/60 hover:shadow-lg transition animate-fade-in"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  <div>
                    <p className="font-medium text-gray-900 text-lg">{test.title}</p>
                    <p className="text-sm text-primary-600">
                      Paid Test • ₹{test.price}
                    </p>
                  </div>
                  {isEnrolled ? (
                    <Link
                      to={`/student/exam/${test._id}`}
                      className="btn-primary flex items-center gap-2 px-5 py-2 rounded-full shadow hover:scale-105 transition"
                    >
                      <Play className="w-4 h-4" />
                      Take Test
                    </Link>
                  ) : (
                    <button
                      className="btn-secondary flex items-center gap-2 px-5 py-2 rounded-full opacity-60 cursor-not-allowed"
                      disabled
                    >
                      <Lock className="w-4 h-4" />
                      Locked
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyDetails;