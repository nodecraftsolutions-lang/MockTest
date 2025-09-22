import { useState, useEffect } from 'react';
import { 
  BarChart3, Download, Eye, Search, Filter, Calendar,
  TrendingUp, Users, Award, FileText
} from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

const AdminResults = () => {
  const [results, setResults] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTest, setFilterTest] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState({
    fromDate: '',
    toDate: ''
  });
  const [selectedResult, setSelectedResult] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchResults();
    fetchTests();
  }, [filterTest, filterStatus, dateRange]);

  const fetchResults = async () => {
    try {
      const params = new URLSearchParams();
      if (filterTest !== 'all') params.append('testId', filterTest);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (dateRange.fromDate) params.append('fromDate', dateRange.fromDate);
      if (dateRange.toDate) params.append('toDate', dateRange.toDate);

      const response = await api.get(`/admin/results?${params.toString()}`);
      if (response.data.success) {
        setResults(response.data.data.attempts);
      }
    } catch (error) {
      showError('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const fetchTests = async () => {
    try {
      const response = await api.get('/tests');
      if (response.data.success) {
        setTests(response.data.data.tests);
      }
    } catch (error) {
      console.error('Failed to load tests');
    }
  };

  const exportResults = async () => {
    try {
      const params = new URLSearchParams();
      if (filterTest !== 'all') params.append('testId', filterTest);
      if (dateRange.fromDate) params.append('fromDate', dateRange.fromDate);
      if (dateRange.toDate) params.append('toDate', dateRange.toDate);
      params.append('format', 'csv');

      const response = await api.get(`/admin/results/export?${params.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `results-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      showSuccess('Results exported successfully');
    } catch (error) {
      showError('Failed to export results');
    }
  };

  const viewResultDetails = (result) => {
    setSelectedResult(result);
    setShowDetailsModal(true);
  };

  const filteredResults = results.filter(result => {
    const matchesSearch = 
      result.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.testId?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculate statistics
  const stats = {
    totalAttempts: filteredResults.length,
    averageScore: filteredResults.length > 0 
      ? Math.round(filteredResults.reduce((sum, r) => sum + r.score, 0) / filteredResults.length)
      : 0,
    passedAttempts: filteredResults.filter(r => r.isPassed).length,
    completedAttempts: filteredResults.filter(r => r.status === 'submitted' || r.status === 'auto-submitted').length
  };

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Results & Analytics</h1>
          <p className="text-gray-600">View and analyze student performance</p>
        </div>
        <button
          onClick={exportResults}
          className="btn-primary flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Results
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalAttempts}</p>
          <p className="text-sm text-gray-600">Total Attempts</p>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.completedAttempts}</p>
          <p className="text-sm text-gray-600">Completed</p>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
          <p className="text-sm text-gray-600">Average Score</p>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.passedAttempts}</p>
          <p className="text-sm text-gray-600">Passed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students or tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          
          <select
            value={filterTest}
            onChange={(e) => setFilterTest(e.target.value)}
            className="input-field"
          >
            <option value="all">All Tests</option>
            {tests.map(test => (
              <option key={test._id} value={test._id}>
                {test.title}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field"
          >
            <option value="all">All Status</option>
            <option value="submitted">Submitted</option>
            <option value="auto-submitted">Auto-submitted</option>
            <option value="in-progress">In Progress</option>
          </select>

          <input
            type="date"
            value={dateRange.fromDate}
            onChange={(e) => setDateRange({ ...dateRange, fromDate: e.target.value })}
            className="input-field"
            placeholder="From Date"
          />

          <input
            type="date"
            value={dateRange.toDate}
            onChange={(e) => setDateRange({ ...dateRange, toDate: e.target.value })}
            className="input-field"
            placeholder="To Date"
          />
        </div>
      </div>

      {/* Results Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResults.map((result) => (
                <tr key={result._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {result.studentId?.name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {result.studentId?.email || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {result.testId?.title || 'Unknown Test'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {result.testId?.companyId?.name || 'Unknown Company'}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {result.score}%
                    </div>
                    <div className="text-sm text-gray-500">
                      {result.correctAnswers}/{result.totalQuestions} correct
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {result.rank && (
                        <div className="flex items-center">
                          <Award className="w-4 h-4 mr-1" />
                          Rank {result.rank}
                        </div>
                      )}
                      {result.percentile && (
                        <div className="flex items-center">
                          <BarChart3 className="w-4 h-4 mr-1" />
                          {result.percentile}%ile
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      <div>
                        <div>{new Date(result.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(result.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      result.status === 'submitted' ? 'bg-green-100 text-green-800' :
                      result.status === 'auto-submitted' ? 'bg-yellow-100 text-yellow-800' :
                      result.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {result.status}
                    </span>
                    {result.isPassed && (
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Passed
                        </span>
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => viewResultDetails(result)}
                        className="text-primary-600 hover:text-primary-900 flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </button>
                      
                      <button
                        onClick={() => {
                          // Download individual result
                          window.open(`/api/v1/admin/results/${result._id}/download`, '_blank');
                        }}
                        className="text-green-600 hover:text-green-900 flex items-center"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Result Details Modal */}
      {showDetailsModal && selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Result Details - {selectedResult.testId?.title}
              </h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedResult(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Student & Test Info */}
              <div className="space-y-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Name</label>
                      <p className="text-gray-900">{selectedResult.studentId?.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{selectedResult.studentId?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Test</label>
                      <p className="text-gray-900">{selectedResult.testId?.title}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Company</label>
                      <p className="text-gray-900">{selectedResult.testId?.companyId?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Start Time</label>
                      <p className="text-gray-900">
                        {new Date(selectedResult.startTime).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">End Time</label>
                      <p className="text-gray-900">
                        {selectedResult.endTime 
                          ? new Date(selectedResult.endTime).toLocaleString()
                          : 'Not completed'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Duration</label>
                      <p className="text-gray-900">{selectedResult.duration} minutes</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        selectedResult.status === 'submitted' ? 'bg-green-100 text-green-800' :
                        selectedResult.status === 'auto-submitted' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedResult.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{selectedResult.score}%</div>
                      <div className="text-sm text-gray-600">Overall Score</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedResult.correctAnswers}
                      </div>
                      <div className="text-sm text-gray-600">Correct</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {selectedResult.incorrectAnswers}
                      </div>
                      <div className="text-sm text-gray-600">Incorrect</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-600">
                        {selectedResult.unansweredQuestions}
                      </div>
                      <div className="text-sm text-gray-600">Unanswered</div>
                    </div>
                  </div>
                </div>

                {selectedResult.sectionWiseScore && selectedResult.sectionWiseScore.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Section-wise Performance</h3>
                    <div className="space-y-3">
                      {selectedResult.sectionWiseScore.map((section, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{section.sectionName}</p>
                            <p className="text-sm text-gray-600">
                              {section.correctAnswers}/{section.totalQuestions} correct
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{section.score}%</p>
                            <p className="text-sm text-gray-600">{section.timeSpent}min</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedResult.violations && selectedResult.violations.length > 0 && (
                  <div className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-red-600">
                      Violations ({selectedResult.violations.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedResult.violations.map((violation, index) => (
                        <div key={index} className="p-2 bg-red-50 rounded text-sm">
                          <div className="font-medium text-red-800">{violation.type}</div>
                          <div className="text-red-600">
                            {new Date(violation.timestamp).toLocaleString()}
                          </div>
                          {violation.details && (
                            <div className="text-red-600">{violation.details}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  window.open(`/api/v1/admin/results/${selectedResult._id}/download`, '_blank');
                }}
                className="btn-secondary"
              >
                Download Report
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedResult(null);
                }}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredResults.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
          <p className="text-gray-600">
            {searchTerm || filterTest !== 'all' || filterStatus !== 'all' || dateRange.fromDate || dateRange.toDate
              ? 'Try adjusting your search or filter criteria'
              : 'No test results available yet'
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminResults;