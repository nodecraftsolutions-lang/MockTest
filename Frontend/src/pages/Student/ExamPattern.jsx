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
        setCompanies(response.data.data.companies);
      }
    } catch (error) {
      showError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyPattern = async (companyId) => {
    try {
      const response = await api.get(`/companies/${companyId}/pattern`);
      if (response.data.success) {
        setSelectedCompany(response.data.data);
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
              onClick={() => fetchCompanyPattern(company._id)}
              className={`p-4 border rounded-lg text-center transition-colors hover:border-primary-300 hover:bg-primary-50 ${
                selectedCompany?.companyName === company.name 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200'
              }`}
            >
              <div className="w-12 h-12 bg-gray-200 rounded-lg mx-auto mb-2"></div>
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
              {selectedCompany.companyName} - Exam Pattern
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{selectedCompany.totalQuestions}</div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{selectedCompany.totalDuration}</div>
                <div className="text-sm text-gray-600">Minutes</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{selectedCompany.cutoffPercentage}%</div>
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Section
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Questions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Negative Marking
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Marks per Question
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedCompany.pattern.map((section, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{section.sectionName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{section.questions}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{section.duration} min</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {section.negativeMarking ? `${section.negativeMarking * 100}%` : 'No'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{section.marksPerQuestion || 1}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Instructions */}
          {selectedCompany.instructions && selectedCompany.instructions.length > 0 && (
            <div className="card">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <AlertCircle className="w-5 h-5 text-amber-500 mr-2" />
                Important Instructions
              </h4>
              
              <div className="space-y-3">
                {selectedCompany.instructions.map((instruction, index) => (
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

          {/* Tips and Strategy */}
          <div className="card">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Preparation Tips</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Time Management</h5>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Allocate time based on section weightage</li>
                  <li>• Don't spend too much time on difficult questions</li>
                  <li>• Keep 5-10 minutes for final review</li>
                  <li>• Practice with timer to build speed</li>
                </ul>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-900 mb-3">Strategy</h5>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Start with your strongest section</li>
                  <li>• Mark questions for review if unsure</li>
                  <li>• Be mindful of negative marking</li>
                  <li>• Attempt all easy questions first</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Sample Questions Preview */}
          <div className="card">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">What to Expect</h4>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <h5 className="font-medium text-gray-900 mb-3">Question Types</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">Multiple Choice</div>
                  <div className="text-sm text-gray-600">Single correct answer</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">Multiple Select</div>
                  <div className="text-sm text-gray-600">Multiple correct answers</div>
                </div>
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">Numerical</div>
                  <div className="text-sm text-gray-600">Enter numeric value</div>
                </div>
              </div>
            </div>
          </div>
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