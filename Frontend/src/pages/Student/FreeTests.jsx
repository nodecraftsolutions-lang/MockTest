import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Clock, FileText, Users, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

const FreeTests = () => {
  const [companies, setCompanies] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanies();
    fetchFreeTests();
  }, []);

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/companies');
      if (res.data.success) {
        setCompanies(res.data.data.companies || []);
      }
    } catch (error) {
      showError('Failed to load companies');
    }
  };

  const fetchFreeTests = async () => {
    try {
      const res = await api.get('/tests?type=free');
      if (res.data.success) {
        setTests(res.data.data.tests || []);
      }
    } catch (error) {
      showError('Failed to load free tests');
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchTest = async (testId) => {
    try {
      const res = await api.post(`/tests/${testId}/launch`, {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      if (res.data.success) {
        const { attemptId } = res.data.data;
        showSuccess('Test launched successfully!');
        navigate(`/student/exam/${testId}?attemptId=${attemptId}`);
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to start test');
    }
  };

  const getTestsByCompany = (companyId) =>
    tests.filter((test) => test.companyId._id === companyId);

  if (loading) return <LoadingSpinner size="large" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Free Mock Tests</h1>
        <p className="text-gray-600">Practice with free tests from top companies</p>
      </div>

      {/* Company Filter */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Company</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <button
            onClick={() => setSelectedCompany(null)}
            className={`p-4 border rounded-lg text-center transition-colors ${
              selectedCompany === null
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium">All Companies</div>
            <div className="text-sm text-gray-600">{tests.length} tests</div>
          </button>

          {companies.map((company) => {
            const companyTests = getTestsByCompany(company._id);
            if (companyTests.length === 0) return null;
            return (
              <button
                key={company._id}
                onClick={() => setSelectedCompany(company._id)}
                className={`p-4 border rounded-lg text-center transition-colors ${
                  selectedCompany === company._id
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt={company.name}
                    className="w-12 h-12 object-contain mx-auto mb-2"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-2" />
                )}
                <div className="font-medium">{company.name}</div>
                <div className="text-sm text-gray-600">{companyTests.length} tests</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tests by Company */}
      <div className="space-y-4">
        {companies
          .filter((c) => selectedCompany === null || c._id === selectedCompany)
          .map((company) => {
            const companyTests = getTestsByCompany(company._id);
            if (companyTests.length === 0) return null;
            return (
              <div key={company._id} className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {company.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {companyTests.length} free test(s) available
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/student/mock-tests/${company._id}`}
                    className="text-primary-600 hover:text-primary-700 text-sm flex items-center"
                  >
                    View Pattern <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {companyTests.map((test) => (
                    <div
                      key={test._id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">
                            {test.title}
                          </h4>
                          <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 mr-1" />
                              {test.totalQuestions} Questions
                            </div>
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {test.duration} Minutes
                            </div>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {test.difficulty}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleLaunchTest(test._id)}
                            className="btn-primary"
                          >
                            Start Test
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default FreeTests;
