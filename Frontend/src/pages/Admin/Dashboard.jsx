import { useState, useEffect } from 'react';
import { 
  Users, Building, BookOpen, DollarSign, TrendingUp, 
  Activity, Award, BarChart3, Calendar, Eye, RefreshCw,
  TrendingUp as TrendingUpIcon, UserCheck, FileText, Video, GraduationCap
} from 'lucide-react';
import api from '../../api/axios';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  const { overview, recentActivities, analytics } = dashboardData || {};

  const statCards = [
    {
      title: 'Total Students',
      value: overview?.totalStudents || 0,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      change: '+12%',
      active: overview?.activeStudents || 0,
      link: '/admin/students'
    },
    {
      title: 'Total Companies',
      value: overview?.totalCompanies || 0,
      icon: Building,
      color: 'from-green-500 to-green-600',
      change: '+5%',
      link: '/admin/companies'
    },
    {
      title: 'Total Tests',
      value: overview?.totalTests || 0,
      icon: BookOpen,
      color: 'from-purple-500 to-purple-600',
      change: '+8%',
      link: '/admin/tests'
    },
    {
      title: 'Total Courses',
      value: overview?.totalCourses || 0,
      icon: GraduationCap,
      color: 'from-indigo-500 to-indigo-600',
      change: '+15%',
      link: '/admin/course/list'
    },
    {
      title: 'Total Revenue',
      value: `₹${overview?.totalRevenue?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'from-orange-500 to-orange-600',
      change: '+15%',
      link: '/admin/orders'
    },
    {
      title: 'Total Attempts',
      value: overview?.totalAttempts || 0,
      icon: Activity,
      color: 'from-indigo-500 to-indigo-600',
      change: '+20%',
      link: '/admin/results'
    },
    {
      title: 'Total Orders',
      value: overview?.totalOrders || 0,
      icon: Award,
      color: 'from-pink-500 to-pink-600',
      change: '+10%',
      link: '/admin/orders'
    },
    {
      title: 'Total Recordings',
      value: overview?.totalRecordings || 0,
      icon: Video,
      color: 'from-teal-500 to-teal-600',
      change: '+7%',
      link: '/admin/recordings/upload'
    }
  ];

  // Format monthly revenue data for chart
  const revenueChartData = analytics?.monthlyRevenue?.map(item => ({
    month: `${item._id.year}-${item._id.month.toString().padStart(2, '0')}`,
    revenue: item.revenue,
    orders: item.orderCount
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Overview of platform performance and activities</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Link 
              key={index} 
              to={stat.link}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 block"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  {stat.active !== undefined && (
                    <div className="flex items-center mt-1">
                      <UserCheck className="w-4 h-4 text-green-500 mr-1" />
                      <p className="text-sm text-gray-500">{stat.active} active</p>
                    </div>
                  )}
                  <div className="flex items-center mt-2">
                    <TrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                    <p className="text-sm text-green-600">{stat.change} from last month</p>
                  </div>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
          {revenueChartData.length > 0 ? (
            <div className="space-y-4">
              {revenueChartData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {new Date(item.month).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-8">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900">₹{item.revenue?.toLocaleString() || 0}</p>
                      <p className="text-sm text-gray-600">Revenue</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900">{item.orders || 0}</p>
                      <p className="text-sm text-gray-600">Orders</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No revenue data available</p>
            </div>
          )}
        </div>

        {/* Top Performing Tests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Tests</h3>
          {analytics?.topPerformingTests && analytics.topPerformingTests.length > 0 ? (
            <div className="space-y-3">
              {analytics.topPerformingTests.map((test, index) => (
                <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                      <span className="text-indigo-600 font-bold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{test.title}</p>
                      <p className="text-sm text-gray-600">{test.attemptCount} attempts</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{Math.round(test.avgScore || 0)}%</p>
                    <p className="text-sm text-gray-600">Avg Score</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No test performance data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Students</h3>
            <Link to="/admin/students" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
              View All
            </Link>
          </div>
          
          {recentActivities?.students && recentActivities.students.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.students.map((student) => (
                <div key={student._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No recent students</p>
            </div>
          )}
        </div>

        {/* Recent Attempts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Attempts</h3>
            <Link to="/admin/results" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
              View All
            </Link>
          </div>
          
          {recentActivities?.attempts && recentActivities.attempts.length > 0 ? (
            <div className="space-y-3">
              {recentActivities.attempts.map((attempt) => (
                <div key={attempt._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{attempt.testId?.title}</p>
                      <p className="text-sm text-gray-600">{attempt.studentId?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{attempt.score || 0}%</p>
                    <p className="text-sm text-gray-600">
                      {new Date(attempt.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No recent attempts</p>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Statistics Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Monthly Performance</h3>
          <div className="flex items-center space-x-2">
            <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option>Last 12 months</option>
              <option>Last 6 months</option>
              <option>Last 3 months</option>
            </select>
          </div>
        </div>
        
        {analytics?.monthlyStats && analytics.monthlyStats.length > 0 ? (
          <div className="space-y-4">
            {analytics.monthlyStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {new Date(stat._id.year, stat._id.month - 1).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long' 
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-8">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">{stat.attempts}</p>
                    <p className="text-sm text-gray-600">Attempts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-gray-900">{Math.round(stat.avgScore || 0)}%</p>
                    <p className="text-sm text-gray-600">Avg Score</p>
                  </div>
                  <div className="w-32">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, Math.round(stat.avgScore || 0))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No statistics available</p>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
          <Link to="/admin/orders" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
            View All
          </Link>
        </div>
        
        {recentActivities?.orders && recentActivities.orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentActivities.orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.studentId?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{order.totalAmount?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                        order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link to={`/admin/orders/${order._id}`} className="text-indigo-600 hover:text-indigo-900 flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No recent orders</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;