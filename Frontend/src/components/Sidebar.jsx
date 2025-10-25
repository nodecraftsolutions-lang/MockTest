import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  GraduationCap,
  BarChart3,
  ShoppingBag,
  User,
  Trophy,
  Building,
  Video,
  Headphones,
  ChevronDown,
  LogOut,
  Settings,
  Users,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Menu,
  Plus,
  Upload,
  Database,
  ListStartIcon,
  Calendar,
  Play,
  List,
  FileCheck,
  MessageSquare
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ type = "student", onStateChange }) => {
  const initializedRef = useRef(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [courses, setCourses] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  // Initialize state from localStorage
  useEffect(() => {
    if (!initializedRef.current) {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null) {
        setIsCollapsed(JSON.parse(savedState));
      }
      initializedRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (type === "student") {
      api.get("/courses")
        .then((res) => setCourses(res.data.data || []))
        .catch(() => setCourses([]));

      api.get("/courses")
        .then((res) => setRecordings(res.data.data || []))
        .catch(() => setRecordings([]));
    }
  }, [type]);

  // Close mobile sidebar when route changes
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  }, [location.pathname]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      } else {
        // On mobile, save the current collapsed state before closing
        localStorage.setItem('sidebarCollapsed', JSON.stringify(isCollapsed));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isCollapsed]);

  // Notify parent of state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange(isCollapsed, isMobileOpen);
    }
  }, [isCollapsed, isMobileOpen, onStateChange]);

  const toggleDropdown = (menu) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(!isMobileOpen);
    } else {
      const newCollapsedState = !isCollapsed;
      setIsCollapsed(newCollapsedState);
      // Save state to localStorage
      localStorage.setItem('sidebarCollapsed', JSON.stringify(newCollapsedState));
      if (newCollapsedState) {
        setOpenDropdown(null);
      }
      // Notify parent of state change
      if (onStateChange) {
        onStateChange(newCollapsedState, isMobileOpen);
      }
    }
  };

  const NavItem = ({ to, icon: Icon, label, showLabel = true, isActive }) => {
    const active = isActive !== undefined ? isActive : location.pathname === to;
    return (
      <Link
        to={to}
        onClick={() => {
          if (window.innerWidth < 1024) {
            setIsMobileOpen(false);
          }
        }}
        className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
          active
            ? "bg-gradient-to-r from-primary-50 to-primary-25 text-primary-700 border-l-4 border-primary-500 shadow-xs"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        } ${isCollapsed ? "justify-center" : ""}`}
        title={isCollapsed ? label : ""}
      >
        <Icon className={`w-5 h-5 ${isCollapsed ? "" : "mr-3"} ${active ? "text-primary-600" : "text-gray-500 group-hover:text-primary-600"}`} />
        {!isCollapsed && showLabel && (
          <span className={active ? "font-semibold" : ""}>{label}</span>
        )}
        {isCollapsed && (
          <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-lg">
            {label}
          </div>
        )}
      </Link>
    );
  };

  const DropdownButton = ({ icon: Icon, label, menu, hasChildren = false }) => (
    <button
      onClick={() => toggleDropdown(menu)}
      className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
        isCollapsed ? "justify-center" : ""
      } ${
        openDropdown === menu 
          ? "bg-gradient-to-r from-primary-50 to-primary-25 text-primary-700 shadow-xs" 
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
      title={isCollapsed ? label : ""}
    >
      <span className={`flex items-center ${isCollapsed ? "" : "flex-1"}`}>
        <Icon className={`w-5 h-5 ${isCollapsed ? "" : "mr-3"} ${openDropdown === menu ? "text-primary-600" : "text-gray-500"}`} />
        {!isCollapsed && <span className={openDropdown === menu ? "font-semibold" : ""}>{label}</span>}
      </span>
      {!isCollapsed && hasChildren && (
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            openDropdown === menu ? "rotate-180" : ""
          }`}
        />
      )}
    </button>
  );

  const DropdownContent = ({ children, menu }) =>
    !isCollapsed && openDropdown === menu ? (
      <div className="ml-4 mt-1 mb-2 space-y-1 animate-in fade-in-0 zoom-in-95 border-l-2 border-gray-100 pl-3">
        {children}
      </div>
    ) : null;

  const MockTestSubItem = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      onClick={() => {
        if (window.innerWidth < 1024) {
          setIsMobileOpen(false);
        }
      }}
      className={`flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-200 group ${
        location.pathname === to
          ? "bg-gradient-to-r from-primary-50 to-primary-25 text-primary-700 font-medium border-l-2 border-primary-500 -ml-0.5 shadow-xs"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <Icon className={`w-4 h-4 mr-3 ${location.pathname === to ? "text-primary-500" : "text-gray-400 group-hover:text-primary-500"}`} />
      <span className={location.pathname === to ? "font-medium" : ""}>{label}</span>
    </Link>
  );

  const AdminSubItem = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      onClick={() => {
        if (window.innerWidth < 1024) {
          setIsMobileOpen(false);
        }
      }}
      className={`flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-200 group ${
        location.pathname === to
          ? "bg-gradient-to-r from-primary-50 to-primary-25 text-primary-700 font-medium border-l-2 border-primary-500 -ml-0.5 shadow-xs"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <Icon className={`w-4 h-4 mr-3 ${location.pathname === to ? "text-primary-500" : "text-gray-400 group-hover:text-primary-500"}`} />
      <span className={location.pathname === to ? "font-medium" : ""}>{label}</span>
    </Link>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-30 p-2 bg-white border border-gray-200 rounded-lg shadow-lg lg:hidden hover:bg-gray-50 transition-colors duration-200"
      >
        <Menu className="w-5 h-5 text-gray-600" />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen bg-white border-r border-gray-200 flex flex-col z-50 transition-all duration-300 ease-in-out transform ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${
          isCollapsed ? "w-16" : "w-64"
        } shadow-lg`}
      >
        {/* Header */}
        <div className={`px-4 py-5 border-b border-gray-100 flex items-center justify-between ${isCollapsed ? "px-3" : ""}`}>
          {!isCollapsed && (
            <div className="flex items-center">
              <div className="flex items-center">
                <Link to="/" className="flex items-center space-x-2">
                  <img
                    src="/Final Logo.png"
                    alt="MockTest Pro Logo"
                    className="h-7 w-auto"
                  />
                </Link>
              </div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight ml-2">
                {type === "admin" ? "Admin" : "Student"}
              </h1>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
          )}
          
          {/* Toggle Button */}
          <button
            onClick={toggleSidebar}
            className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200 ${
              isCollapsed ? "absolute -right-3 top-6 bg-white border border-gray-200 shadow-md hover:shadow-lg" : ""
            }`}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 px-2 py-4 overflow-y-auto ${isCollapsed ? "px-1 py-3" : "py-3"}`}>
          {type === "student" ? (
            <>
              <div className="mb-1">
                <NavItem 
                  to="/student" 
                  icon={LayoutDashboard} 
                  label="Dashboard" 
                  showLabel={!isCollapsed}
                />
              </div>

              {/* Courses Dropdown */}
              <div className="relative group mb-2">
                <DropdownButton 
                  icon={GraduationCap} 
                  label="Courses" 
                  menu="courses" 
                  hasChildren={true}
                />

                <DropdownContent menu="courses">
                  {courses.slice(0, 5).map((c) => (
                    <Link
                      key={c._id}
                      to={`/student/courses/${c._id}`}
                      className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors truncate"
                      title={c.title}
                    >
                      {c.title}
                    </Link>
                  ))}
                  
                  {courses.length > 5 && (
                    <Link
                      to="/student/courses"
                      className="block px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg font-medium transition-colors mt-1"
                    >
                      View All Courses
                    </Link>
                  )}

                  <Link
                    to="/student/my-courses"
                    className="block px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg font-medium transition-colors mt-1"
                  >
                    My Courses
                  </Link>
                </DropdownContent>
              </div>

              {/* Recordings Dropdown */}
              <div className="relative group mb-2">
                <DropdownButton 
                  icon={Video} 
                  label="Recordings" 
                  menu="recordings" 
                  hasChildren={true}
                />
                
                <DropdownContent menu="recordings">
                  {recordings.length > 0 ? (
                    recordings.slice(0, 5).map((c) => (
                      <Link
                        key={c._id}
                        to={`/student/recordings/${c._id}`}
                        className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors truncate"
                        title={c.title}
                      >
                        {c.title}
                      </Link>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-xs text-gray-400 italic">
                      No recordings available
                    </p>
                  )}
                  {recordings.length > 5 && (
                    <Link
                      to="/student/recordings"
                      className="block px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-lg font-medium transition-colors mt-1"
                    >
                      View All Recordings
                    </Link>
                  )}
                </DropdownContent>
              </div>

              <div className="mb-1">
                <NavItem 
                  to="/student/mock-tests" 
                  icon={BookOpen} 
                  label="Mock Tests" 
                  showLabel={!isCollapsed}
                />
              </div>

              <div className="mb-1">
                <NavItem 
                  to="/student/results" 
                  icon={BarChart3} 
                  label="Results" 
                  showLabel={!isCollapsed}
                />
              </div>
              <div className="mb-1">
                <NavItem 
                  to="/student/orders" 
                  icon={ShoppingBag} 
                  label="Orders" 
                  showLabel={!isCollapsed}
                />
              </div>
              <div className="mb-1">
                <NavItem 
                  to="/student/profile" 
                  icon={User} 
                  label="Profile" 
                  showLabel={!isCollapsed}
                />
              </div>
              <div className="mb-1">
                <NavItem 
                  to="/student/contact" 
                  icon={Headphones} 
                  label="Contact" 
                  showLabel={!isCollapsed}
                />
              </div>
            </>
          ) : (
            <>
              <div className="mb-1">
                <NavItem 
                  to="/admin" 
                  icon={LayoutDashboard} 
                  label="Dashboard" 
                  showLabel={!isCollapsed}
                />
              </div>
              
              <div className="relative group mb-2">
                <DropdownButton 
                  icon={Building} 
                  label="MockTest" 
                  menu="mocktest" 
                  hasChildren={true}
                />
                
                <DropdownContent menu="mocktest">
                  <MockTestSubItem 
                    to="/admin/mocktest" 
                    icon={Building} 
                    label="Company & Test Management" 
                  />
                  <MockTestSubItem 
                    to="/admin/mocktest/question-generate" 
                    icon={ListStartIcon} 
                    label="Generate Test Questions" 
                  />
                  <MockTestSubItem 
                    to="/admin/mocktest/question-bank-upload" 
                    icon={Upload} 
                    label="Question Bank Upload" 
                  />
                </DropdownContent>
              </div>
              
              <div className="relative group mb-2">
                <DropdownButton 
                  icon={BookOpen} 
                  label="Course Management" 
                  menu="course" 
                  hasChildren={true}
                />
                
                <DropdownContent menu="course">
                  <AdminSubItem 
                    to="/admin/course/management" 
                    icon={Database} 
                    label="All Courses" 
                  />
                  <AdminSubItem 
                    to="/admin/course/create" 
                    icon={Plus} 
                    label="Create New Course" 
                  />
                  <AdminSubItem 
                    to="/admin/course/sessions" 
                    icon={Calendar} 
                    label="Upload Sessions" 
                  />
                  <AdminSubItem 
                    to="/admin/course/discussions" 
                    icon={MessageSquare} 
                    label="Student Discussions" 
                  />
                </DropdownContent>
              </div>

              <div className="relative group mb-2">
                <DropdownButton 
                  icon={Video} 
                  label="Recordings Management" 
                  menu="recordings" 
                  hasChildren={true}
                />
                
                <DropdownContent menu="recordings">
                  <AdminSubItem 
                    to="/admin/recordings/upload" 
                    icon={Settings} 
                    label="Manage Recordings" 
                  />
                </DropdownContent>
              </div>

              <div className="mb-1">
                <NavItem 
                  to="/admin/students" 
                  icon={Users} 
                  label="Students" 
                  showLabel={!isCollapsed}
                />
              </div>
              <div className="mb-1">
                <NavItem 
                  to="/admin/results" 
                  icon={BarChart3} 
                  label="Results" 
                  showLabel={!isCollapsed}
                />
              </div>
              <div className="mb-1">
                <NavItem 
                  to="/admin/payments" 
                  icon={DollarSign} 
                  label="Payments" 
                  showLabel={!isCollapsed}
                />
              </div>
              <div className="mb-1">
                <NavItem 
                  to="/admin/alumni" 
                  icon={GraduationCap} 
                  label="Alumni" 
                  showLabel={!isCollapsed}
                />
              </div>
              <div className="mb-1">
                <NavItem 
                  to="/admin/settings" 
                  icon={Settings} 
                  label="Settings" 
                  showLabel={!isCollapsed}
                />
              </div>
            </>
          )}
        </nav>

        {/* User + Logout */}
        <div className={`p-4 border-t border-gray-100 ${isCollapsed ? "px-2 py-3" : "py-3"}`}>
          <div className={`flex items-center ${isCollapsed ? "justify-center flex-col" : "justify-between"}`}>
            <div className={`flex items-center ${isCollapsed ? "flex-col space-y-2" : ""}`}>
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              {!isCollapsed && (
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                    {user?.name || (type === "admin" ? "Admin" : "Student")}
                  </p>
                  <p className="text-xs text-gray-500">
                    {type === "admin" ? "Administrator" : "Student"}
                  </p>
                </div>
              )}
            </div>
            
            {!isCollapsed && (
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg px-2 py-1 flex items-center transition-colors duration-200"
              >
                <LogOut className="w-4 h-4 mr-1" /> 
                Logout
              </button>
            )}
            
            {isCollapsed && (
              <button
                onClick={logout}
                className="mt-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;