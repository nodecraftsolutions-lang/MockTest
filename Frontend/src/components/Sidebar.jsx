import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  BookOpen,
  CreditCard,
  BarChart3,
  ShoppingBag,
  User,
  Trophy,
  Users,
  Settings,
  FileText,
  DollarSign,
  Building,
  Menu,
  X,
} from "lucide-react";



const Sidebar = ({ type = "student" }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  const studentNavItems = [
    { name: "Dashboard", path: "/student", icon: Home },
    { name: "Exam Pattern", path: "/student/exam-pattern", icon: FileText },
    { name: "Free Tests", path: "/student/free-tests", icon: BookOpen },
    { name: "Paid Tests", path: "/student/paid-tests", icon: CreditCard },
    { name: "Results", path: "/student/results", icon: BarChart3 },
    { name: "Orders", path: "/student/orders", icon: ShoppingBag },
    { name: "Profile", path: "/student/profile", icon: User },
    { name: "Leaderboard", path: "/student/leaderboard", icon: Trophy },
  ];

  const adminNavItems = [
    { name: "Dashboard", path: "/admin", icon: Home },
    { name: "Companies", path: "/admin/companies", icon: Building },
    { name: "Tests", path: "/admin/tests", icon: BookOpen },
    { name: "Students", path: "/admin/students", icon: Users },
    { name: "Results", path: "/admin/results", icon: BarChart3 },
    { name: "Payments", path: "/admin/payments", icon: DollarSign },
    { name: "Settings", path: "/admin/settings", icon: Settings },
  ];

  const navItems = type === "admin" ? adminNavItems : studentNavItems;

  // Close mobile sidebar when a link is clicked
  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-primary-600 text-white shadow-md"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen bg-white/90 backdrop-blur-lg shadow-xl border-r border-gray-200 transition-all duration-300 z-50
          ${isCollapsed ? "w-20" : "w-64"} 
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-200">
          {!isCollapsed && (
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
              {type === "admin" ? "Admin Panel" : "Student Panel"}
            </span>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-gray-600 hover:text-primary-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <Menu className="w-6 h-6" /> : <X className="w-6 h-6" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-6 px-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            // Check if current path starts with item path for active state
            const isActive = location.pathname === item.path || 
                            (item.path !== "/student" && item.path !== "/admin" && 
                             location.pathname.startsWith(item.path));

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={handleLinkClick}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative
                  ${
                    isActive
                      ? "bg-primary-50 text-primary-700 shadow-sm border-l-4 border-primary-500 font-semibold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                title={isCollapsed ? item.name : ""}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    isActive 
                      ? "text-primary-600" 
                      : "text-gray-400 group-hover:text-primary-600"
                  }`}
                />
                {!isCollapsed && (
                  <span className="ml-3 transition-opacity duration-200">{item.name}</span>
                )}
                
                {/* Tooltip for collapsed state */}
                {isCollapsed && (
                  <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md z-10">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User profile section at bottom */}
        {!isCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white/80">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">John Doe</p>
                <p className="text-xs text-gray-500">{type === "admin" ? "Administrator" : "Student"}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;