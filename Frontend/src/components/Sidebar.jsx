import { useState, useEffect } from "react";
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
  FileCheck
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ type = "student" }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [courses, setCourses] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

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

  const toggleDropdown = (menu) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    // Close all dropdowns when collapsing
    if (!isCollapsed) {
      setOpenDropdown(null);
    }
  };

  const NavItem = ({ to, icon: Icon, label, showLabel = true }) => (
    <Link
      to={to}
      className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors group ${
        location.pathname === to
          ? "bg-primary-50 text-primary-700 border-l-4 border-primary-500"
          : "text-gray-600 hover:bg-gray-50"
      } ${isCollapsed ? "justify-center" : ""}`}
      title={isCollapsed ? label : ""}
    >
      <Icon className={`w-5 h-5 ${isCollapsed ? "" : "mr-3"} text-primary-600`} />
      {!isCollapsed && showLabel && label}
      {isCollapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
          {label}
        </div>
      )}
    </Link>
  );

  const DropdownButton = ({ icon: Icon, label, menu, hasChildren = false }) => (
    <button
      onClick={() => toggleDropdown(menu)}
      className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors ${
        isCollapsed ? "justify-center" : ""
      } ${
        openDropdown === menu ? "bg-primary-50 text-primary-700" : "text-gray-600"
      }`}
      title={isCollapsed ? label : ""}
    >
      <span className={`flex items-center ${isCollapsed ? "" : "flex-1"}`}>
        <Icon className={`w-5 h-5 ${isCollapsed ? "" : "mr-3"} text-primary-600`} />
        {!isCollapsed && label}
      </span>
      {!isCollapsed && hasChildren && (
        <ChevronDown
          className={`w-4 h-4 transform transition-transform ${
            openDropdown === menu ? "rotate-180" : ""
          }`}
        />
      )}
      {isCollapsed && openDropdown === menu && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap">
          {label}
        </div>
      )}
    </button>
  );

  const DropdownContent = ({ children, menu }) =>
    !isCollapsed && openDropdown === menu ? (
      <div className="ml-4 space-y-1 animate-in fade-in-0 zoom-in-95 border-l-2 border-gray-100 pl-2">
        {children}
      </div>
    ) : null;

  const MockTestSubItem = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      className={`flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors group ${
        location.pathname === to
          ? "bg-primary-50 text-primary-700 border-l-2 border-primary-500 -ml-0.5"
          : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      <Icon className="w-4 h-4 mr-3 text-primary-500" />
      {label}
    </Link>
  );

  const AdminSubItem = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      className={`flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors group ${
        location.pathname === to
          ? "bg-primary-50 text-primary-700 border-l-2 border-primary-500 -ml-0.5"
          : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      <Icon className="w-4 h-4 mr-3 text-primary-500" />
      {label}
    </Link>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {!isCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen bg-white shadow-lg border-r border-gray-200 flex flex-col z-50 transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Header */}
        <div className={`px-4 py-5 border-b flex items-center justify-between ${isCollapsed ? "px-3" : ""}`}>
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-primary-700">
              {type === "admin" ? "Admin Panel" : "Student Panel"}
            </h1>
          )}
          {isCollapsed && (
            <Menu className="w-5 h-5 text-primary-600 mx-auto" />
          )}
          
          {/* Toggle Button */}
          <button
            onClick={toggleSidebar}
            className={`p-1.5 rounded-lg hover:bg-gray-100 transition-colors ${
              isCollapsed ? "absolute -right-3 top-6 bg-white border border-gray-200" : ""
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
        <nav className={`flex-1 px-2 py-4 space-y-2 overflow-y-auto ${isCollapsed ? "px-1" : ""}`}>
          {type === "student" ? (
            <>
              <NavItem 
                to="/student" 
                icon={LayoutDashboard} 
                label="Dashboard" 
                showLabel={!isCollapsed}
              />

              {/* Mock Tests */}
              <NavItem 
                to="/student/mock-tests" 
                icon={BookOpen} 
                label="Mock Tests" 
                showLabel={!isCollapsed}
              />

              {/* Courses Dropdown */}
              <div className="relative group">
                <DropdownButton 
                  icon={GraduationCap} 
                  label="Courses" 
                  menu="courses" 
                  hasChildren={true}
                />
                
                <DropdownContent menu="courses">
                  {/* All available courses */}
                  {courses.map((c) => (
                    <Link
                      key={c._id}
                      to={`/student/courses/${c._id}`}
                      className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      {c.title}
                    </Link>
                  ))}

                  {/* My Courses link */}
                  <Link
                    to="/student/my-courses"
                    className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                  >
                    My Courses
                  </Link>
                </DropdownContent>
              </div>

              {/* Recordings Dropdown */}
              <div className="relative group">
                <DropdownButton 
                  icon={Video} 
                  label="Recordings" 
                  menu="recordings" 
                  hasChildren={true}
                />
                
                <DropdownContent menu="recordings">
                  {recordings.length > 0 ? (
                    recordings.map((c) => (
                      <Link
                        key={c._id}
                        to={`/student/recordings/${c._id}`}
                        className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        {c.title}
                      </Link>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-xs text-gray-400 italic">
                      No courses available
                    </p>
                  )}
                </DropdownContent>
              </div>

              {/* Regular Nav Items */}
              <NavItem 
                to="/student/results" 
                icon={BarChart3} 
                label="Results" 
                showLabel={!isCollapsed}
              />
              <NavItem 
                to="/student/orders" 
                icon={ShoppingBag} 
                label="Orders" 
                showLabel={!isCollapsed}
              />
              <NavItem 
                to="/student/leaderboard" 
                icon={Trophy} 
                label="Leaderboard" 
                showLabel={!isCollapsed}
              />
              <NavItem 
                to="/student/profile" 
                icon={User} 
                label="Profile" 
                showLabel={!isCollapsed}
              />
              <NavItem 
                to="/student/contact" 
                icon={Headphones} 
                label="Contact" 
                showLabel={!isCollapsed}
              />
            </>
          ) : (
            <>
              <NavItem 
                to="/admin" 
                icon={LayoutDashboard} 
                label="Dashboard" 
                showLabel={!isCollapsed}
              />
              
              
              {/* MockTest Dropdown with nested items */}
              <div className="relative group">
                <DropdownButton 
                  icon={Building} 
                  label="MockTest" 
                  menu="mocktest" 
                  hasChildren={true}
                />
                
                <DropdownContent menu="mocktest">
                  <MockTestSubItem 
                    to="/admin/mocktest/create-company" 
                    icon={Plus} 
                    label="Create Company" 
                  />
                  <MockTestSubItem 
                    to="/admin/mocktest/test-creation" 
                    icon={BookOpen} 
                    label="Test Creation for Company" 
                  />
                  <MockTestSubItem 
                    to="/admin/mocktest/question-bank-upload" 
                    icon={Upload} 
                    label="Question Bank Upload" 
                  />
                  <MockTestSubItem 
                    to="/admin/mocktest/question-generate" 
                    icon={ListStartIcon} 
                    label="Generate Test Questions" 
                  />
                  {/* Added: Manage/View Companies and Tests */}
                  <MockTestSubItem 
                    to="/admin/companies" 
                    icon={Building} 
                    label="Manage Companies" 
                  />
                  <MockTestSubItem 
                    to="/admin/tests" 
                    icon={FileCheck} 
                    label="Manage Tests" 
                  />
                </DropdownContent>
              </div>
              {/* Course Management Dropdown */}
              <div className="relative group">
                <DropdownButton 
                  icon={BookOpen} 
                  label="Course Management" 
                  menu="course" 
                  hasChildren={true}
                />
                
                <DropdownContent menu="course">
                  <AdminSubItem 
                    to="/admin/course/create" 
                    icon={Plus} 
                    label="Course Creation" 
                  />
                  <AdminSubItem 
                    to="/admin/course/sessions" 
                    icon={Calendar} 
                    label="Upload Sessions for Courses" 
                  />
                  <AdminSubItem 
                    to="/admin/course/list" 
                    icon={Database} 
                    label="All Courses" 
                  />
                </DropdownContent>
              </div>

              {/* Recordings Management Dropdown */}
              <div className="relative group">
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

              {/* Resource Management Dropdown */}
              <div className="relative group">
                <DropdownButton 
                  icon={FileText} 
                  label="Resource Management" 
                  menu="Resource" 
                  hasChildren={true}
                />
                
                <DropdownContent menu="Resource">
                  <AdminSubItem 
                    to="/admin/course/resourcesrec" 
                    icon={Settings} 
                    label="Manage Recordings Resources" 
                  />
                  <AdminSubItem 
                    to="/admin/course/resources" 
                    icon={Settings} 
                    label="Manage Course Resources" 
                  />
                
                </DropdownContent>
              </div>

              {/* Regular Admin Nav Items */}
              <NavItem 
                to="/admin/students" 
                icon={Users} 
                label="Students" 
                showLabel={!isCollapsed}
              />
              <NavItem 
                to="/admin/results" 
                icon={BarChart3} 
                label="Results" 
                showLabel={!isCollapsed}
              />
              <NavItem 
                to="/admin/payments" 
                icon={DollarSign} 
                label="Payments" 
                showLabel={!isCollapsed}
              />
              <NavItem 
                to="/admin/settings" 
                icon={Settings} 
                label="Settings" 
                showLabel={!isCollapsed}
              />
            </>
          )}
        </nav>

        {/* User + Logout */}
        <div className={`p-4 border-t border-gray-200 ${isCollapsed ? "px-2" : ""}`}>
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
            <div className={`flex items-center ${isCollapsed ? "flex-col space-y-1" : ""}`}>
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              {!isCollapsed && (
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
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
                className="text-sm text-red-600 hover:underline flex items-center transition-colors"
              >
                <LogOut className="w-4 h-4 mr-1" /> 
                Logout
              </button>
            )}
            
            {isCollapsed && (
              <button
                onClick={logout}
                className="mt-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Toggle Button (when sidebar is collapsed on mobile) */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="fixed top-4 left-4 z-40 p-2 bg-white border border-gray-200 rounded-lg shadow-lg lg:hidden"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
      )}
    </>
  );
};

export default Sidebar;