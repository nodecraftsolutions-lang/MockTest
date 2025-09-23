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
        let sorted = response.data.data.attempts || [];

        // Sort attempts
        if (sortBy === 'date') {
          sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (sortBy === 'score') {
          sorted.sort((a, b) => b.score - a.score);
        }

        setAttempts(sorted);
      }
    } catch (error) {
      showError('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status, isPassed) => {
    if (status === 'in-progress') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          In Progress
        </span>
      );
    }
    if (status === 'submitted' || status === 'auto-submitted') {
      return (
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isPassed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {isPassed ? 'Passed' : 'Failed'}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        {status}
      </span>
    );
  };

  const calculateStats = () => {
    const completed = attempts.filter(
      (a) => a.status === 'submitted' || a.status === 'auto-submitted'
    );
    const passed = completed.filter((a) => a.isPassed);
    const totalScore = completed.reduce((sum, a) => sum + (a.score || 0), 0);

    return {
      totalAttempts: attempts.length,
      completedAttempts: completed.length,
      passedAttempts: passed.length,
      averageScore: completed.length > 0 ? Math.round(totalScore / completed.length) : 0,
      passRate: completed.length > 0 ? Math.round((passed.length / completed.length) * 100) : 0,
    };
  };

  const stats = calculateStats();

  if (loading) return <LoadingSpinner size="large" />;

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
        <StatCard icon={FileText} color="bg-blue-100 text-blue-600" value={stats.totalAttempts} label="Total Attempts" />
        <StatCard icon={Trophy} color="bg-green-100 text-green-600" value={stats.completedAttempts} label="Completed" />
        <StatCard icon={Award} color="bg-purple-100 text-purple-600" value={stats.passedAttempts} label="Passed" />
        <StatCard icon={TrendingUp} color="bg-orange-100 text-orange-600" value={`${stats.averageScore}`} label="Avg Score" />
        <StatCard icon={BarChart3} color="bg-indigo-100 text-indigo-600" value={`${stats.passRate}%`} label="Pass Rate" />
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className="input-field">
              <option value="all">All Results</option>
              <option value="submitted">Completed</option>
              <option value="in-progress">In Progress</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input-field">
              <option value="date">Date</option>
              <option value="score">Score</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attempts.map((attempt) => (
                <tr key={attempt._id} className="hover:bg-gray-50">
                  {/* Test Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{attempt.testId?.title}</div>
                      <div className="text-sm text-gray-500">{attempt.testId?.companyId?.name || "N/A"}</div>
                    </div>
                  </td>

                  {/* Score */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{attempt.score}</div>
                    <div className="text-sm text-gray-500">
                      {attempt.correctAnswers}/{attempt.totalQuestions} correct
                    </div>
                  </td>

                  {/* Performance */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    <div className="flex flex-col space-y-1">
                      {attempt.rank && (
                        <span className="flex items-center">
                          <Trophy className="w-4 h-4 mr-1 text-yellow-600" /> Rank {attempt.rank}
                        </span>
                      )}
                      {attempt.percentile && (
                        <span className="flex items-center">
                          <BarChart3 className="w-4 h-4 mr-1 text-indigo-600" /> {attempt.percentile}%ile
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(attempt.createdAt).toLocaleString()}
                    </div>
                    {attempt.actualTimeTaken > 0 && (
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        {attempt.actualTimeTaken} min
                      </div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(attempt.status, attempt.isPassed)}</td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {(attempt.status === 'submitted' || attempt.status === 'auto-submitted') && (
                        <>
                          <Link
                            to={`/student/results/${attempt._id}`}
                            className="text-primary-600 hover:text-primary-900 flex items-center"
                          >
                            <Eye className="w-4 h-4 mr-1" /> View
                          </Link>
                          <button
                            onClick={() =>
                              window.open(
                                `/api/v1/students/attempts/${attempt._id}/download`,
                                '_blank'
                              )
                            }
                            className="text-green-600 hover:text-green-900 flex items-center"
                          >
                            <Download className="w-4 h-4 mr-1" /> Download
                          </button>
                        </>
                      )}

                      {attempt.status === 'in-progress' && (
                        <Link
                          to={`/student/exam/${attempt.testId?._id}`}
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

const StatCard = ({ icon: Icon, color, value, label }) => (
  <div className="card text-center">
    <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mx-auto mb-3`}>
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-600">{label}</p>
  </div>
);

export default Results;
