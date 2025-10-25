import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart3, Eye, Calendar, Trophy, Search,
  TrendingUp, Clock, FileText, Award, 
  CheckCircle, XCircle, AlertCircle, ChevronDown,
  ChevronUp, Filter, ArrowUpDown, Sparkles, Loader2
} from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

const Results = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    fetchAttempts();
  }, [filter, sortBy, sortOrder, searchQuery]);

  const fetchAttempts = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);

      const response = await api.get(`/students/attempts?${params.toString()}`);
      if (response.data.success) {
        let sorted = response.data.data.attempts || [];
        setAttempts(sorted);
      }
    } catch (error) {
      showError('Failed to load results');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchAttempts();
  };

  const sortedAttempts = useMemo(() => {
    if (!attempts.length) return [];
    
    // Group attempts by testId and keep only the most recent one
    const groupedAttempts = attempts.reduce((acc, attempt) => {
      const testId = attempt.testId?._id || attempt.testId;
      if (!testId) return acc;
      
      if (!acc[testId] || new Date(attempt.createdAt) > new Date(acc[testId].createdAt)) {
        acc[testId] = attempt;
      }
      return acc;
    }, {});
    
    // Convert grouped object back to array
    let filtered = Object.values(groupedAttempts);
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        attempt => 
          (attempt.testId?.title?.toLowerCase().includes(query)) ||
          (attempt.testId?.companyId?.name?.toLowerCase().includes(query)) ||
          (attempt.testId?.company?.name?.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'desc'
          ? new Date(b.createdAt) - new Date(a.createdAt)
          : new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === 'score') {
        const scoreA = a.score || 0;
        const scoreB = b.score || 0;
        return sortOrder === 'desc' ? scoreB - scoreA : scoreA - scoreB;
      }
      return 0;
    });
  }, [attempts, sortBy, sortOrder, searchQuery]);

  const calculateStats = () => {
    const completed = attempts.filter(
      (a) => a.status === 'submitted' || a.status === 'auto-submitted'
    );
    const passed = completed.filter((a) => a.isPassed);
    const totalScore = completed.reduce((sum, a) => sum + (a.score || 0), 0);
    const highestScore = completed.length > 0 
      ? Math.max(...completed.map(a => a.score || 0)) 
      : 0;

    return {
      totalAttempts: attempts.length,
      completedAttempts: completed.length,
      passedAttempts: passed.length,
      averageScore: completed.length > 0 ? Math.round(totalScore / completed.length) : 0,
      passRate: completed.length > 0 ? Math.round((passed.length / completed.length) * 100) : 0,
      highestScore
    };
  };

  const stats = calculateStats();

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const getStatusBadge = (status, isPassed) => {
    if (status === 'in-progress') {
      return (
        <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          In Progress
        </span>
      );
    }
    if (status === 'submitted' || status === 'auto-submitted') {
      return isPassed ? (
        <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Passed
        </span>
      ) : (
        <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
        {status}
      </span>
    );
  };

  if (loading) return <LoadingSpinner size="large" />;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        // Removed bg-white, now only gradient background
        className="bg-blue-500 to from-primary-600 to-primary-800 text-black rounded-2xl p-8 shadow-lg"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Test Results Dashboard</h1>
            <p className="text-primary-100">Track your performance and progress across all tests</p>
          </div>
          <div className="mt-4 md:mt-0">
            <button 
              onClick={handleRefresh}
              className="flex items-center bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all"
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5 mr-2" />
              )}
              {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { icon: FileText, color: "blue", value: stats.totalAttempts, label: "Total Attempts" },
          { icon: Trophy, color: "green", value: stats.completedAttempts, label: "Completed" },
          { icon: Award, color: "purple", value: stats.passedAttempts, label: "Passed" },
          { icon: TrendingUp, color: "orange", value: `${stats.averageScore}`, label: "Avg Score" },
          { icon: BarChart3, color: "indigo", value: `${stats.passRate}%`, label: "Pass Rate" },
          { icon: Trophy, color: "amber", value: stats.highestScore, label: "Highest Score" }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-white rounded-xl shadow-md p-5"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by test name or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center md:justify-start px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filters
            {showFilters ? (
              <ChevronUp className="w-4 h-4 ml-2" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-2" />
            )}
          </button>
        </div>
        
        {/* Expanded Filters */}
        {showFilters && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)} 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Results</option>
                <option value="submitted">Completed</option>
                <option value="in-progress">In Progress</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="date">Date</option>
                <option value="score">Score</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
              <button
                onClick={toggleSortOrder}
                className="w-full flex items-center justify-between border border-gray-300 rounded-lg p-2.5 bg-white hover:bg-gray-50"
              >
                <span>{sortOrder === 'desc' ? 'Highest to Lowest' : 'Lowest to Highest'}</span>
                <ArrowUpDown className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Results Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white rounded-xl shadow-md overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedAttempts.map((attempt, index) => {
                const actualTime =
                  attempt.startTime && attempt.endTime
                    ? Math.floor((new Date(attempt.endTime) - new Date(attempt.startTime)) / 60000)
                    : null;

                return (
                  <motion.tr 
                    key={attempt._id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    {/* Test Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{attempt.testId?.title || "Untitled Test"}</div>
                          <div className="text-sm text-gray-500">
                            {attempt.testId?.companyId?.name || 
                             (attempt.testId?.company?.name) || 
                             "No Company Assigned"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Score */}
                    <td className="px-6 py-4">
                      <div className="text-lg font-semibold text-gray-900">
                        {attempt.score !== undefined && attempt.score !== null ? attempt.score : "N/A"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {attempt.correctAnswers || 0}/{attempt.totalQuestions || 0} correct
                      </div>
                      {attempt.score !== undefined && attempt.score !== null && (
                        <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-primary-600 h-1.5 rounded-full" 
                            style={{ width: `${(attempt.score / (attempt.testId?.totalMarks || 100)) * 100}%` }}
                          ></div>
                        </div>
                      )}
                    </td>

                    {/* Performance */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex flex-col space-y-2">
                        {attempt.rank && (
                          <span className="flex items-center bg-yellow-50 text-yellow-700 px-2 py-1 rounded-md">
                            <Trophy className="w-4 h-4 mr-1 text-yellow-600" /> Rank {attempt.rank}
                          </span>
                        )}
                        {attempt.percentile && (
                          <span className="flex items-center bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md">
                            <BarChart3 className="w-4 h-4 mr-1 text-indigo-600" /> {attempt.percentile}%ile
                          </span>
                        )}
                        {!attempt.rank && !attempt.percentile && (
                          <span className="text-gray-400 italic">No data</span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                        {new Date(attempt.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Clock className="w-4 h-4 mr-1 text-gray-400" />
                        {new Date(attempt.createdAt).toLocaleTimeString()}
                      </div>
                      {actualTime !== null && (
                        <div className="flex items-center text-sm text-gray-500 mt-1 bg-gray-50 px-2 py-0.5 rounded">
                          <Clock className="w-4 h-4 mr-1" />
                          {actualTime} min
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(attempt.status, attempt.isPassed)}</td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {(attempt.status === 'submitted' || attempt.status === 'auto-submitted') && (
                          <Link
                            to={`/student/results/${attempt._id}`}
                            className="text-primary-600 hover:text-primary-900 flex items-center bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-1.5" /> View Details
                          </Link>
                        )}
                        {attempt.status === 'in-progress' && (
                          <Link
                            to={`/student/exam/${attempt.testId?._id}?attemptId=${attempt._id}`}
                            className="text-blue-600 hover:text-blue-900 flex items-center bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Clock className="w-4 h-4 mr-1.5" /> Continue Test
                          </Link>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {sortedAttempts.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16"
          >
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No matching results found' : 'No Results Yet'}
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchQuery 
                ? 'Try adjusting your search or filters to find what you\'re looking for'
                : 'Take your first test to see your performance and track your progress'}
            </p>
            <div className="flex justify-center gap-4">
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Clear Search
                </button>
              )}
              <Link 
                to="/student/mock-tests" 
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Browse Tests
              </Link>
              
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

const StatCard = ({ icon: Icon, color, value, label }) => (
  <div className={`bg-white rounded-xl shadow-md p-5 border-b-4 border-${color}-500 hover:shadow-lg transition-shadow`}>
    <div className={`w-12 h-12 bg-${color}-100 text-${color}-600 rounded-lg flex items-center justify-center mb-3`}>
      <Icon className="w-6 h-6" />
    </div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-600 mt-1">{label}</p>
  </div>
);

export default Results;