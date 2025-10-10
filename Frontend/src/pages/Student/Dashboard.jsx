import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Trophy,
  TrendingUp,
  Award,
  Play,
  CreditCard,
  DollarSign,
  BarChart3,
  Target,
  CheckCircle,
  Users,
  ChevronRight,
  Menu,
  X,
  User,
  Calendar,
  Clock,
  Activity,
  ArrowUpRight,
  GraduationCap,
  Crown
} from "lucide-react";
import api from "../../api/axios";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

// Animated Pie Chart Component
const AnimatedPieChart = ({ data, size = 180 }) => {
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size / 2 - 10;
  
  let startAngle = 0;
  
  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth="12"
        />
        
        {/* Animated segments */}
        {data.map((segment, index) => {
          const percentage = segment.percentage;
          const strokeDasharray = 2 * Math.PI * radius;
          const strokeDashoffset = strokeDasharray - (strokeDasharray * percentage) / 100;
          const segmentStartAngle = startAngle;
          startAngle += (percentage / 100) * 360;
          
          return (
            <circle
              key={index}
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="12"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDasharray}
              strokeLinecap="round"
            >
              <animate
                attributeName="stroke-dashoffset"
                from={strokeDasharray}
                to={strokeDashoffset}
                dur="1s"
                fill="freeze"
                begin={`${index * 0.2}s`}
              />
            </circle>
          );
        })}
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-900">
          {data.reduce((sum, item) => sum + item.value, 0)}
        </span>
        <span className="text-xs text-gray-500">Total</span>
      </div>
    </div>
  );
};

// Stat card component with trend indicator
const StatCard = ({ title, value, icon: Icon, color, description, trend }) => (
  <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 p-6 border border-gray-100">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    {trend && (
      <div className="mt-4 flex items-center">
        <ArrowUpRight className="w-4 h-4 text-green-500" />
        <span className="text-sm font-medium text-green-600 ml-1">{trend}</span>
        <span className="text-xs text-gray-500 ml-1">from last month</span>
      </div>
    )}
  </div>
);

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { showError, showSuccess } = useToast();
  const { logout } = useAuth();

  useEffect(() => {
    fetchDashboardData();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get("/auth/me");
      if (response.data.success) {
        setUser(response.data.data.student);
      }
    } catch (error) {
      console.error("Profile error:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await api.get("/students/dashboard");
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      showError("Failed to load dashboard data");
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      logout();
      showSuccess("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="p-6 text-gray-600 bg-white rounded-xl shadow-lg">No dashboard data available.</div>
      </div>
    );
  }

  const { statistics, recentAttempts, recentOrders } = dashboardData;

  // Statistics cards with real data
  const statCards = [
    {
      title: "Total Attempts",
      value: statistics?.totalAttempts || 0,
      icon: BookOpen,
      color: "bg-gradient-to-br from-blue-500 to-indigo-600",
      description: "Tests taken",
      trend: "+12%"
    },
    {
      title: "Completed Tests",
      value: statistics?.completedAttempts || 0,
      icon: Trophy,
      color: "bg-gradient-to-br from-green-500 to-emerald-600",
      description: "Tests finished",
      trend: "+8%"
    },
    {
      title: "Average Score",
      value: `${statistics?.averageScore || 0}%`,
      icon: TrendingUp,
      color: "bg-gradient-to-br from-purple-500 to-fuchsia-600",
      description: "Overall performance",
      trend: "+5%"
    },
    {
      title: "Pass Rate",
      value: `${statistics?.passRate || 0}%`,
      icon: Award,
      color: "bg-gradient-to-br from-amber-500 to-orange-600",
      description: "Success rate",
      trend: "+3%"
    }
  ];

  // Quick action cards - redirecting to companies page (mocktests)
  const quickActions = [
    {
      title: "Take Free Test",
      description: "Practice with free mock tests",
      icon: Play,
      color: "text-blue-600 bg-blue-50 hover:bg-blue-100",
      to: "/student/mock-tests"
    },
    {
      title: "Buy Premium Tests",
      description: "Access premium test series",
      icon: Crown,
      color: "text-amber-600 bg-amber-50 hover:bg-amber-100",
      to: "/student/mock-tests"
    },
    {
      title: "View Results",
      description: "Check your performance",
      icon: BarChart3,
      color: "text-green-600 bg-green-50 hover:bg-green-100",
      to: "/student/results"
    },
    {
      title: "My Courses",
      description: "Access enrolled courses",
      icon: GraduationCap,
      color: "text-purple-600 bg-purple-50 hover:bg-purple-100",
      to: "/student/courses"
    }
  ];

  // Performance data for pie chart
  const performanceData = [
    { 
      name: "Passed", 
      value: statistics?.passedAttempts || 0, 
      percentage: statistics?.totalAttempts > 0 
        ? Math.round((statistics?.passedAttempts / statistics?.totalAttempts) * 100) 
        : 0,
      color: "#10B981" 
    },
    { 
      name: "Failed", 
      value: (statistics?.totalAttempts || 0) - (statistics?.passedAttempts || 0), 
      percentage: statistics?.totalAttempts > 0 
        ? Math.round(((statistics?.totalAttempts - statistics?.passedAttempts) / statistics?.totalAttempts) * 100) 
        : 0,
      color: "#EF4444" 
    },
    { 
      name: "Pending", 
      value: 0, 
      percentage: 0,
      color: "#9CA3AF" 
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Mobile menu button */}
      <div className="md:hidden p-4 bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-xl absolute z-20 w-full">
          <div className="px-4 py-3 space-y-1 border-b border-gray-200">
            <Link 
              to="/student/mock-tests" 
              className="block px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-blue-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Free Tests
            </Link>
            <Link 
              to="/student/mock-tests" 
              className="block px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-blue-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Paid Tests
            </Link>
            <Link 
              to="/student/results" 
              className="block px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-blue-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Results
            </Link>
            <Link 
              to="/student/courses" 
              className="block px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-blue-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Courses
            </Link>
            <button 
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:bg-blue-50"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Welcome back, <span className="text-blue-600">{user?.name || "Student"}</span>
              </h1>
              <p className="text-gray-600 mt-1">Here's your learning progress overview</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <User className="w-5 h-5 text-gray-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name || "Student"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.email?.substring(0, 25) || "user@example.com"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {statCards.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Main Content Grid - Balanced Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Recent Attempts */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Attempts</h3>
                <Link 
                  to="/student/results" 
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                >
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              {recentAttempts && recentAttempts.length > 0 ? (
                <div className="space-y-4">
                  {recentAttempts.slice(0, 3).map((attempt) => (
                    <div 
                      key={attempt._id} 
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-lg ${
                          attempt.isPassed 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-red-100 text-red-600'
                        }`}>
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {attempt.testId?.title?.length > 30 
                              ? `${attempt.testId?.title.substring(0, 30)}...` 
                              : attempt.testId?.title}
                          </p>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{new Date(attempt.createdAt).toLocaleDateString()}</span>
                            <Clock className="w-4 h-4 ml-2 mr-1" />
                            <span>{attempt.testId?.duration || 0} min</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">{attempt.score}%</p>
                        <p className={`text-sm font-medium ${
                          attempt.isPassed ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {attempt.isPassed ? 'Passed' : 'Failed'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-4">No attempts yet</p>
                  <Link 
                    to="/student/mock-tests" 
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 font-medium shadow-sm"
                  >
                    Take your first test
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                <Link 
                  to="/student/orders" 
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                >
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              {recentOrders && recentOrders.length > 0 ? (
                <div className="space-y-4">
                  {recentOrders.slice(0, 2).map((order) => (
                    <div 
                      key={order._id} 
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                          <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            Order #{order._id?.substring(0, 8)}
                          </p>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                            <span className="mx-2">•</span>
                            <span>{order.items?.length || 0} item(s)</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">₹{order.totalAmount || 0}</p>
                        <p className={`text-sm font-medium ${
                          order.paymentStatus === "completed"
                            ? "text-green-600"
                            : order.paymentStatus === "failed"
                            ? "text-red-600"
                            : "text-amber-600"
                        }`}>
                          {order.paymentStatus || "pending"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <DollarSign className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 mb-4">No orders yet</p>
                  <Link 
                    to="/student/mock-tests" 
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all duration-300 font-medium shadow-sm"
                  >
                    Browse premium tests
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={index}
                      to={action.to}
                      className={`rounded-lg p-4 border border-gray-200 ${action.color} transition-all duration-200 group hover:shadow-sm`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className={`p-3 rounded-full mb-3 ${action.color.replace('hover:bg-', 'bg-').replace('text-', 'text-').split(' ')[0]}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <p className="font-medium text-gray-900 mb-1">{action.title}</p>
                        <p className="text-xs text-gray-600">{action.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Performance Summary with Animated Pie Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Summary</h3>
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-6 md:mb-0 md:mr-6">
                  <AnimatedPieChart data={performanceData} size={180} />
                </div>
                <div className="flex-1 w-full">
                  <div className="space-y-4">
                    {performanceData.filter(item => item.value > 0 || item.name !== "Pending").map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-3 h-3 rounded-full mr-3" 
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className="text-sm font-medium text-gray-700">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-gray-900">{item.value}</span>
                          <span className="text-xs text-gray-500 block">{item.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <Activity className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Keep Going!</p>
                          <p className="text-xs text-gray-500">Consistency is key</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-gray-900">
                          {statistics?.totalAttempts || 0}
                        </p>
                        <p className="text-xs text-gray-500">Tests Taken</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;