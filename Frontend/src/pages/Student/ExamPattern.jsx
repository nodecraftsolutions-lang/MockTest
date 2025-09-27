import { useState, useEffect } from 'react';
import { Clock, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

const ExamPattern = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await api.get('/companies');
      if (response.data.success) {
        setCompanies(response.data.data.companies || []);
      }
    } catch (error) {
      showError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyDetails = async (companyId) => {
    try {
      const response = await api.get(`/companies/${companyId}`);
      if (response.data.success) {
        setSelectedCompany(response.data.data.company);
      }
    } catch (error) {
      showError('Failed to load exam pattern');
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Exam Patterns</h1>
        <p className="text-gray-600">Understand the structure and format of tests from different companies</p>
      </div>

      {/* Company Selection */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Company</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {companies.map((company) => (
            <button
              key={company._id}
              onClick={() => fetchCompanyDetails(company._id)}
              className={`p-4 border rounded-lg text-center transition-colors hover:border-primary-300 hover:bg-primary-50 ${
                selectedCompany?._id === company._id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200'
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
              <div className="font-medium text-gray-900">{company.name}</div>
              <div className="text-sm text-gray-600">{company.category}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Pattern Details */}
      {selectedCompany && (
        <div className="space-y-6">
          {/* Overview */}
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {selectedCompany.name} - Exam Pattern
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">
                  {selectedCompany.totalQuestions}
                </div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">
                  {selectedCompany.totalDuration} min
                </div>
                <div className="text-sm text-gray-600">Duration</div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">
                  {selectedCompany.metadata?.cutoffPercentage || 60}%
                </div>
                <div className="text-sm text-gray-600">Passing Criteria</div>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900">Section-wise Breakdown</h4>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Questions</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Negative Marking</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marks per Question</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedCompany.defaultPattern.map((section, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4">{section.sectionName}</td>
                        <td className="px-6 py-4">{section.questionCount}</td>
                        <td className="px-6 py-4">{section.duration} min</td>
                        <td className="px-6 py-4">
                          {section.negativeMarking ? `${section.negativeMarking * 100}%` : 'No'}
                        </td>
                        <td className="px-6 py-4">{section.marksPerQuestion || 1}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Instructions */}
          {selectedCompany.metadata?.instructions?.length > 0 && (
            <div className="card">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 text-amber-500 mr-2" />
                Important Instructions
              </h4>

              <div className="space-y-3">
                {selectedCompany.metadata.instructions.map((instruction, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center mt-0.5">
                      <span className="text-xs font-medium text-amber-600">{index + 1}</span>
                    </div>
                    <p className="text-gray-700">{instruction}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!selectedCompany && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Company</h3>
          <p className="text-gray-600">Choose a company above to view its exam pattern and structure</p>
        </div>
      )}
    </div>
  );
};

export default ExamPattern;
