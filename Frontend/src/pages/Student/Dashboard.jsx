import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, Clock, Trophy, TrendingUp, 
  Play, CreditCard, DollarSign, Award ,BarChart3
} from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/students/dashboard');
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      showError('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  const { statistics, recentAttempts, recentOrders } = dashboardData || {};

  const statCards = [
    {
      title: 'Total Attempts',
      value: statistics?.totalAttempts || 0,
      icon: BookOpen,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Completed Tests',
      value: statistics?.completedAttempts || 0,
      icon: Trophy,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Average Score',
      value: `${statistics?.averageScore || 0}%`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+5%'
    },
    {
      title: 'Pass Rate',
      value: `${statistics?.passRate || 0}%`,
      icon: Award,
      color: 'bg-orange-500',
      change: '+15%'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your progress overview.</p>
        </div>
        <Link 
          to="/student/free-tests" 
          className="btn-primary flex items-center"
        >
          <Play className="w-4 h-4 mr-2" />
          Take Test
        </Link>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-green-600">{stat.change} from last month</p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attempts */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Attempts</h3>
            <Link to="/student/results" className="text-primary-600 hover:text-primary-700 text-sm">
              View All
            </Link>
          </div>
          
          {recentAttempts && recentAttempts.length > 0 ? (
            <div className="space-y-3">
              {recentAttempts.map((attempt) => (
                <div key={attempt._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{attempt.testId?.title}</p>
                      <p className="text-sm text-gray-600">
                        {attempt.testId?.companyId?.name} • {new Date(attempt.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{attempt.score}%</p>
                    <p className={`text-sm ${attempt.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                      {attempt.isPassed ? 'Passed' : 'Failed'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No attempts yet</p>
              <Link to="/student/free-tests" className="text-primary-600 hover:text-primary-700 text-sm">
                Take your first test
              </Link>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <Link to="/student/orders" className="text-primary-600 hover:text-primary-700 text-sm">
              View All
            </Link>
          </div>
          
          {recentOrders && recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Order #{order.orderId}</p>
                      <p className="text-sm text-gray-600">
                        {order.items?.length} test(s) • {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">₹{order.totalAmount}</p>
                    <p className={`text-sm ${
                      order.paymentStatus === 'completed' ? 'text-green-600' : 
                      order.paymentStatus === 'failed' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {order.paymentStatus}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No orders yet</p>
              <Link to="/student/paid-tests" className="text-primary-600 hover:text-primary-700 text-sm">
                Browse paid tests
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            to="/student/free-tests" 
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <Play className="w-8 h-8 text-primary-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Take Free Test</p>
              <p className="text-sm text-gray-600">Practice with free mock tests</p>
            </div>
          </Link>
          
          <Link 
            to="/student/paid-tests" 
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <CreditCard className="w-8 h-8 text-primary-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">Buy Premium Tests</p>
              <p className="text-sm text-gray-600">Access premium test series</p>
            </div>
          </Link>
          
          <Link 
            to="/student/results" 
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            <BarChart3 className="w-8 h-8 text-primary-600 mr-3" />
            <div>
              <p className="font-medium text-gray-900">View Results</p>
              <p className="text-sm text-gray-600">Check your performance</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;