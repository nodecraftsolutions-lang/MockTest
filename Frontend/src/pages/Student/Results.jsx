import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, Download, Eye, Calendar, Trophy, 
  TrendingUp, Clock, FileText, Award 
} from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

const Results = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const { showError } = useToast();

  useEffect(() => {
    fetchAttempts();
  }, [filter, sortBy]);

  const fetchAttempts = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      
      const response = await api.get(`/students/attempts?${params.toString()}`);
      if (response.data.success) {
        let sortedAttempts = response.data.data.attempts;
        
        // Sort attempts
        if (sortBy === 'date') {
          sortedAttempts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === 'score') {
          sortedAttempts.sort((a, b) => b.score - a.score);
        }
        
        setAttempts(sortedAttempts);
      }
    } catch (error) {
      showError('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status, isPassed) => {
    if (status === 'in-progress') {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">In Progress</span>;
    }
    if (status === 'submitted' || status === 'auto-submitted') {
      return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isPassed ? 'Passed' : 'Failed'}
        </span>
      );
    }
    return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
  };

  const calculateStats = () => {
    const completedAttempts = attempts.filter(a => a.status === 'submitted' || a.status === 'auto-submitted');
    const passedAttempts = completedAttempts.filter(a => a.isPassed);
    const totalScore = completedAttempts.reduce((sum, a) => sum + a.score, 0);
    
    return {
      totalAttempts: attempts.length,
      completedAttempts: completedAttempts.length,
      passedAttempts: passedAttempts.length,
      averageScore: completedAttempts.length > 0 ? Math.round(totalScore / completedAttempts.length) : 0,
      passRate: completedAttempts.length > 0 ? Math.round((passedAttempts.length / completedAttempts.length) * 100) : 0
    };
  };

  const stats = calculateStats();

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Results</h1>
          <p className="text-gray-600">Track your performance and progress</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalAttempts}</p>
          <p className="text-sm text-gray-600">Total Attempts</p>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.completedAttempts}</p>
          <p className="text-sm text-gray-600">Completed</p>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Award className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.passedAttempts}</p>
          <p className="text-sm text-gray-600">Passed</p>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.averageScore}%</p>
          <p className="text-sm text-gray-600">Avg Score</p>
        </div>
        
        <div className="card text-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.passRate}%</p>
          <p className="text-sm text-gray-600">Pass Rate</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">All Results</option>
                <option value="submitted">Completed</option>
                <option value="in-progress">In Progress</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input-field"
              >
                <option value="date">Date</option>
                <option value="score">Score</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Test Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
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
              {attempts.map((attempt) => (
                <tr key={attempt._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg mr-3"></div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {attempt.testId?.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {attempt.testId?.companyId?.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {attempt.score}%
                    </div>
                    <div className="text-sm text-gray-500">
                      {attempt.correctAnswers}/{attempt.totalQuestions} correct
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {attempt.rank && (
                        <div className="flex items-center">
                          <Trophy className="w-4 h-4 mr-1" />
                          Rank {attempt.rank}
                        </div>
                      )}
                      {attempt.percentile && (
                        <div className="flex items-center">
                          <BarChart3 className="w-4 h-4 mr-1" />
                          {attempt.percentile}%ile
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(attempt.createdAt).toLocaleDateString()}
                    </div>
                    {attempt.actualTimeTaken && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {attempt.actualTimeTaken} min
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(attempt.status, attempt.isPassed)}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {(attempt.status === 'submitted' || attempt.status === 'auto-submitted') && (
                        <>
                          <Link
                            to={`/student/attempts/${attempt._id}`}
                            className="text-primary-600 hover:text-primary-900 flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Link>
                          <button
                            onClick={() => {
                              // Download answer sheet functionality
                              window.open(`/api/v1/students/attempts/${attempt._id}/download`, '_blank');
                            }}
                            className="text-green-600 hover:text-green-900 flex items-center"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </button>
                        </>
                      )}
                      
                      {attempt.status === 'in-progress' && (
                        <Link
                          to={`/exam/${attempt._id}`}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                        >
                          Continue
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {attempts.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
            <p className="text-gray-600 mb-4">Take your first test to see results here</p>
            <Link to="/student/free-tests" className="btn-primary">
              Take Free Test
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Results;