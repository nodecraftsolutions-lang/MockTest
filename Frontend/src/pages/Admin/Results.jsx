import { useState, useEffect } from 'react';
import { 
  BarChart3, Download, Eye, Search, Filter, Calendar,
  TrendingUp, Users, Award, FileText, FileSpreadsheet
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
  const [downloadingReport, setDownloadingReport] = useState({});
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    fetchResults();
    fetchTests();
  }, [filterTest, filterStatus, dateRange.fromDate, dateRange.toDate]);

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

  const downloadStudentReport = async (attemptId) => {
    try {
      // Set downloading state for this specific attempt
      setDownloadingReport(prev => ({ ...prev, [attemptId]: true }));

      // Fetch the attempt data for the individual report
      const response = await api.get(`/admin/results/export?attemptId=${attemptId}&format=json`);
      
      if (response.data.success && response.data.data && response.data.data.length > 0) {
        const attempt = response.data.data[0]; // Get the first (and only) attempt
        
        // Safely extract company name
        const companyName = attempt.testId?.companyId?.name || 'Unknown Company';
        
        // Create CSV content
        const csvContent = `Student Name,Student Email,Test Title,Company,Score,Percentage,Status,Start Time,End Time,Duration (mins),Attempted Questions,Correct Answers,Rank,Percentile
${attempt.studentId?.name || 'N/A'},${attempt.studentId?.email || 'N/A'},${attempt.testId?.title || 'N/A'},${companyName},${attempt.score || 0},${attempt.percentage || 0},${attempt.status || 'N/A'},${attempt.startTime || 'N/A'},${attempt.endTime || 'N/A'},${attempt.actualTimeTaken || 0},${attempt.attemptedQuestions || 0},${attempt.correctAnswers || 0},${attempt.rank || 'N/A'},${attempt.percentile || 'N/A'}`;

        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `student-report-${attempt.studentId?.name || 'student'}-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        showSuccess('Student report downloaded successfully');
      } else {
        showError('No data found for this attempt');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      showError('Failed to download student report: ' + (error.response?.data?.message || error.message || 'Unknown error'));
    } finally {
      // Clear downloading state for this specific attempt
      setDownloadingReport(prev => {
        const newState = { ...prev };
        delete newState[attemptId];
        return newState;
      });
    }
  };

  const viewResultDetails = (result) => {
    setSelectedResult(result);
    setShowDetailsModal(true);
  };

  const filteredResults = results.filter(result => {
    const matchesSearch = 
      (result.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.testId?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.studentId?.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  // Calculate statistics
  const stats = {
    totalAttempts: filteredResults.length,
    averageScore: filteredResults.length > 0 
      ? Math.round(filteredResults.reduce((sum, r) => sum + (r.score || 0), 0) / filteredResults.length)
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalAttempts}</p>
          <p className="text-sm text-gray-600">Total Attempts</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.completedAttempts}</p>
          <p className="text-sm text-gray-600">Completed</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
          <p className="text-sm text-gray-600">Average Score</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.passedAttempts}</p>
          <p className="text-sm text-gray-600">Passed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students or tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
          </div>
          
          <select
            value={filterTest}
            onChange={(e) => setFilterTest(e.target.value)}
            className="border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
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
            className="border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
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
            className="border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            placeholder="From Date"
          />

          <input
            type="date"
            value={dateRange.toDate}
            onChange={(e) => setDateRange({ ...dateRange, toDate: e.target.value })}
            className="border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            placeholder="To Date"
          />
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                <tr key={result._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {result.studentId?.name || 'Unknown Student'}
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
                      {result.score !== undefined ? `${result.score}%` : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {result.correctAnswers !== undefined ? `${result.correctAnswers}/${result.totalQuestions || 0}` : 'N/A'} correct
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      {result.rank && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Award className="w-4 h-4 mr-1 text-amber-500" />
                          <span>Rank {result.rank}</span>
                        </div>
                      )}
                      {result.percentile && (
                        <div className="flex items-center text-sm text-gray-600">
                          <BarChart3 className="w-4 h-4 mr-1 text-indigo-500" />
                          <span>{result.percentile}%ile</span>
                        </div>
                      )}
                      {!result.rank && !result.percentile && (
                        <span className="text-sm text-gray-400 italic">No data</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-1.5 text-gray-400" />
                        <span>{new Date(result.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mt-1">
                        <span>{new Date(result.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col space-y-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        result.status === 'submitted' ? 'bg-green-100 text-green-800' :
                        result.status === 'auto-submitted' ? 'bg-yellow-100 text-yellow-800' :
                        result.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {result.status || 'Unknown'}
                      </span>
                      {result.isPassed !== undefined && (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                          result.isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {result.isPassed ? 'Passed' : 'Failed'}
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => viewResultDetails(result)}
                        className="inline-flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => downloadStudentReport(result._id)}
                        disabled={downloadingReport[result._id]}
                        className="inline-flex items-center px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {downloadingReport[result._id] ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Downloading...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-1" />
                            <span>Report</span>
                          </>
                        )}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-2xl font-bold text-gray-900">
                Result Details - {selectedResult.testId?.title}
              </h2>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedResult(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Student & Test Info */}
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h3>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <p className="font-medium text-gray-900">{selectedResult.studentId?.name || 'Unknown Student'}</p>
                          <p className="text-sm text-gray-600">{selectedResult.studentId?.email || 'N/A'}</p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500">Test</label>
                        <p className="text-gray-900">{selectedResult.testId?.title || 'Unknown Test'}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500">Company</label>
                        <p className="text-gray-900">{selectedResult.testId?.companyId?.name || 'Unknown Company'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Start Time</label>
                        <p className="text-gray-900">
                          {selectedResult.startTime 
                            ? new Date(selectedResult.startTime).toLocaleString()
                            : 'Not started'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500">End Time</label>
                        <p className="text-gray-900">
                          {selectedResult.endTime 
                            ? new Date(selectedResult.endTime).toLocaleString()
                            : 'Not completed'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500">Duration</label>
                        <p className="text-gray-900">
                          {selectedResult.duration || 0} minutes
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          selectedResult.status === 'submitted' ? 'bg-green-100 text-green-800' :
                          selectedResult.status === 'auto-submitted' ? 'bg-yellow-100 text-yellow-800' :
                          selectedResult.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedResult.status || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-3xl font-bold text-blue-600">
                          {selectedResult.score !== undefined ? `${selectedResult.score}%` : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Overall Score</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-3xl font-bold text-green-600">
                          {selectedResult.correctAnswers !== undefined ? selectedResult.correctAnswers : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Correct Answers</div>
                      </div>
                      <div className="text-center p-4 bg-amber-50 rounded-lg">
                        <div className="text-3xl font-bold text-amber-600">
                          {selectedResult.incorrectAnswers !== undefined ? selectedResult.incorrectAnswers : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Incorrect</div>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-3xl font-bold text-gray-600">
                          {selectedResult.unansweredQuestions !== undefined ? selectedResult.unansweredQuestions : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Unanswered</div>
                      </div>
                    </div>
                    
                    {selectedResult.isPassed !== undefined && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                          selectedResult.isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {selectedResult.isPassed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                    )}
                  </div>

                  {(selectedResult.rank || selectedResult.percentile) && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ranking</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedResult.rank && (
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <div className="text-3xl font-bold text-purple-600">#{selectedResult.rank}</div>
                            <div className="text-sm text-gray-600">Rank</div>
                          </div>
                        )}
                        {selectedResult.percentile && (
                          <div className="text-center p-4 bg-indigo-50 rounded-lg">
                            <div className="text-3xl font-bold text-indigo-600">{selectedResult.percentile}%</div>
                            <div className="text-sm text-gray-600">Percentile</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedResult.sectionWiseScore && selectedResult.sectionWiseScore.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                              <p className="font-semibold text-gray-900">{section.score !== undefined ? `${section.score}%` : 'N/A'}</p>
                              <p className="text-sm text-gray-600">{section.timeSpent}min</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedResult.violations && selectedResult.violations.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 text-red-600">
                        Violations ({selectedResult.violations.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedResult.violations.map((violation, index) => (
                          <div key={index} className="p-3 bg-red-50 rounded text-sm">
                            <div className="font-medium text-red-800">{violation.type}</div>
                            <div className="text-red-600">
                              {new Date(violation.timestamp).toLocaleString()}
                            </div>
                            {violation.details && (
                              <div className="text-red-600 mt-1">{violation.details}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => downloadStudentReport(selectedResult._id)}
                  disabled={downloadingReport[selectedResult._id]}
                  className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-800 rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  {downloadingReport[selectedResult._id] ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-green-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download Report
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedResult(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredResults.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {searchTerm || filterTest !== 'all' || filterStatus !== 'all' || dateRange.fromDate || dateRange.toDate
              ? 'Try adjusting your search or filter criteria'
              : 'No test results available yet'
            }
          </p>
          {!(searchTerm || filterTest !== 'all' || filterStatus !== 'all' || dateRange.fromDate || dateRange.toDate) && (
            <button 
              onClick={() => {
                // Reset filters to show all results
                setFilterTest('all');
                setFilterStatus('all');
                setDateRange({ fromDate: '', toDate: '' });
                setSearchTerm('');
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminResults;