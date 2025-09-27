import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Clock, FileText, CheckCircle, Play, Lock } from "lucide-react";
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
      console.error(error);
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

  if (loading) return <LoadingSpinner size="large" />;

  const freeTests = tests.filter((t) => t.type === "free");
  const paidTests = tests.filter((t) => t.type === "paid");

  return (
    <div className="space-y-8">
      {/* Company Header */}
      <div className="card flex items-center space-x-4">
        {company?.logoUrl && (
          <img
            src={company.logoUrl}
            alt={company.name}
            className="w-16 h-16 object-contain"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{company?.name}</h1>
          <p className="text-gray-600">{company?.description}</p>
        </div>
      </div>

      {/* Exam Pattern */}
      {pattern && (
        <div className="card space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {company?.name} Exam Pattern
          </h2>

          {/* Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {pattern.totalQuestions}
              </div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {pattern.totalDuration} min
              </div>
              <div className="text-sm text-gray-600">Duration</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">
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
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Section
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Questions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Marks per Question
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pattern.pattern.map((section, index) => (
                    <tr key={index}>
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
      <div className="card space-y-6">
        <h2 className="text-lg font-semibold text-gray-900">Available Tests</h2>

        {/* Free Tests */}
        {freeTests.length > 0 && (
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-3">
              Free Tests
            </h3>
            <div className="space-y-4">
              {freeTests.map((test) => (
                <div
                  key={test._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow"
                >
                  <div>
                    <p className="font-medium text-gray-900">{test.title}</p>
                    <p className="text-sm text-gray-600">Free Test</p>
                  </div>
                  <Link
                    to={`/student/exam/${test._id}`}
                    className="btn-primary flex items-center"
                  >
                    <Play className="w-4 h-4 mr-2" />
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
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-semibold text-gray-800">Paid Tests</h3>
              {!isEnrolled && (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="btn-primary"
                >
                  {enrolling ? "Enrolling..." : `Enroll Now • ₹${paidTests.reduce((sum, t) => sum + t.price, 0)}`}
                </button>
              )}
            </div>


            <div className="space-y-4">
              {paidTests.map((test) => (
                <div
                  key={test._id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:shadow"
                >
                  <div>
                    <p className="font-medium text-gray-900">{test.title}</p>
                    <p className="text-sm text-gray-600">Paid Test • ₹{test.price}</p>
                  </div>
                  {isEnrolled ? (
                    <Link
                      to={`/student/exam/${test._id}`}
                      className="btn-primary flex items-center"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Take Test
                    </Link>
                  ) : (
                    <button
                      className="btn-secondary flex items-center"
                      disabled
                    >
                      <Lock className="w-4 h-4 mr-2" />
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
