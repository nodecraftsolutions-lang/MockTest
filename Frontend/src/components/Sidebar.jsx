import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, BookOpen, CreditCard, BarChart3, ShoppingBag, 
  User, Trophy, Users, Settings, FileText, DollarSign,
  Building, Menu, X
} from 'lucide-react';

const Sidebar = ({ type = 'student' }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const studentNavItems = [
    { name: 'Dashboard', path: '/student', icon: Home },
    { name: 'Exam Pattern', path: '/student/exam-pattern', icon: FileText },
    { name: 'Free Tests', path: '/student/free-tests', icon: BookOpen },
    { name: 'Paid Tests', path: '/student/paid-tests', icon: CreditCard },
    { name: 'Results', path: '/student/results', icon: BarChart3 },
    { name: 'Orders', path: '/student/orders', icon: ShoppingBag },
    { name: 'Profile', path: '/student/profile', icon: User },
    { name: 'Leaderboard', path: '/student/leaderboard', icon: Trophy }
  ];

  const adminNavItems = [
    { name: 'Dashboard', path: '/admin', icon: Home },
    { name: 'Companies', path: '/admin/companies', icon: Building },
    { name: 'Tests', path: '/admin/tests', icon: BookOpen },
    { name: 'Students', path: '/admin/students', icon: Users },
    { name: 'Results', path: '/admin/results', icon: BarChart3 },
    { name: 'Payments', path: '/admin/payments', icon: DollarSign },
    { name: 'Settings', path: '/admin/settings', icon: Settings }
  ];

  const navItems = type === 'admin' ? adminNavItems : studentNavItems;

  return (
    <div className={`bg-white shadow-lg border-r border-gray-200 h-full transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Toggle Button */}
      <div className="p-4 border-b border-gray-200">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full flex items-center justify-between text-gray-600 hover:text-gray-900"
        >
          {!isCollapsed && (
            <span className="text-lg font-semibold">
              {type === 'admin' ? 'Admin Panel' : 'Student Panel'}
            </span>
          )}
          {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-4 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-3 py-2 mb-1 rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-500'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title={isCollapsed ? item.name : ''}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="ml-3 text-sm font-medium">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;