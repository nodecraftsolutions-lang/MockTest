import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Lock, Unlock, Clock, BookOpen, Play, CreditCard } from "lucide-react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useToast } from "../../context/ToastContext";

const CompanyTests = () => {
  const { companyId } = useParams();
  const [company, setCompany] = useState(null);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    fetchCompanyTests();
  }, [companyId]);

  const fetchCompanyTests = async () => {
    setLoading(true);
    try {
      const companyRes = await api.get(`/companies/${companyId}`);
      const testsRes = await api.get(`/tests?companyId=${companyId}`);
      setCompany(companyRes.data.data.company);
      setTests(testsRes.data.data.tests);
    } catch (error) {
      console.error("Error fetching company tests:", error);
      showError("Failed to load tests");
    } finally {
      setLoading(false);
    }
  };

  const handleUnlockAll = async () => {
    try {
      // 🔹 Call backend to create Razorpay order
      const res = await api.post("/payments/order", {
        companyId,
        purpose: "unlock_tests"
      });

      if (res.data.success) {
        // TODO: Integrate Razorpay Checkout here
        showSuccess("Redirecting to payment...");
      }
    } catch (error) {
      showError("Failed to initiate payment");
    }
  };

  if (loading) return <LoadingSpinner size="large" />;

  return (
    <div className="space-y-6">
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

      {/* Test Format */}
      <div className="card grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div>
          <Clock className="w-6 h-6 text-primary-600 mx-auto mb-1" />
          <p className="font-semibold">{company?.defaultPattern?.duration} mins</p>
          <p className="text-sm text-gray-500">Duration</p>
        </div>
        <div>
          <BookOpen className="w-6 h-6 text-primary-600 mx-auto mb-1" />
          <p className="font-semibold">
            {company?.defaultPattern?.sections?.length || 0}
          </p>
          <p className="text-sm text-gray-500">Sections</p>
        </div>
        <div>
          <BookOpen className="w-6 h-6 text-primary-600 mx-auto mb-1" />
          <p className="font-semibold">{company?.defaultPattern?.totalQuestions || 0}</p>
          <p className="text-sm text-gray-500">Questions</p>
        </div>
      </div>

      {/* Tests List */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Tests</h2>
        <div className="space-y-4">
          {tests.map((test, index) => (
            <div
              key={test._id}
              className="flex items-center justify-between p-4 border rounded-lg hover:shadow"
            >
              <div>
                <p className="font-medium text-gray-900">{test.title}</p>
                <p className="text-sm text-gray-600">
                  {test.type === "free" || index === 0 ? "Free Test" : "Paid Test"}
                </p>
              </div>

              {/* Action */}
              {test.type === "free" || index === 0 || test.isUnlocked ? (
                <Link
                  to={`/student/exam/${test._id}`}
                  className="btn-primary flex items-center"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Take Test
                </Link>
              ) : (
                <button
                  onClick={handleUnlockAll}
                  className="btn-secondary flex items-center"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  Unlock All Tests
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanyTests;
