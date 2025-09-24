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
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({ type = "student" }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [courses, setCourses] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const location = useLocation();
  const { user, logout } = useAuth();

  useEffect(() => {
  if (type === "student") {
    api.get("/courses")
      .then((res) => setCourses(res.data.data || []))
      .catch(() => setCourses([]));

    api.get("/students/recordings")
      .then((res) => setRecordings(res.data.data || []))
      .catch(() => setRecordings([]));
  }
}, [type]);

  const toggleDropdown = (menu) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  const NavItem = ({ to, icon: Icon, label }) => (
    <Link
      to={to}
      className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
        location.pathname === to
          ? "bg-primary-50 text-primary-700 border-l-4 border-primary-500"
          : "text-gray-600 hover:bg-gray-50"
      }`}
    >
      <Icon className="w-5 h-5 mr-3 text-primary-600" />
      {label}
    </Link>
  );

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="px-4 py-5 border-b">
        <h1 className="text-xl font-bold text-primary-700">
          {type === "admin" ? "Admin Panel" : "Student Panel"}
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-2 overflow-y-auto">
        {type === "student" ? (
          <>
            <NavItem to="/student" icon={LayoutDashboard} label="Dashboard" />

            {/* ✅ Mock Tests */}
            <NavItem to="/student/mock-tests" icon={BookOpen} label="Mock Tests" />

            {/* Courses Dropdown */}
<button
  onClick={() => toggleDropdown("courses")}
  className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-lg hover:bg-gray-50"
>
  <span className="flex items-center">
    <GraduationCap className="w-5 h-5 mr-3 text-primary-600" />
    Courses
  </span>
  <ChevronDown
    className={`w-4 h-4 transform transition-transform ${
      openDropdown === "courses" ? "rotate-180" : ""
    }`}
  />
</button>

{openDropdown === "courses" && (
  <div className="ml-8 space-y-1">
    {/* All available courses */}
    {courses.map((c) => (
      <Link
        key={c._id}
        to={`/student/courses/${c._id}`}
        className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
      >
        {c.title}
      </Link>
    ))}

    {/* My Courses link */}
    <Link
      to="/student/my-courses"
      className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg font-medium"
    >
      My Courses
    </Link>
  </div>
)}


            {/* ✅ Recordings Dropdown */}
            <button
              onClick={() => toggleDropdown("recordings")}
              className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-lg hover:bg-gray-50"
            >
              <span className="flex items-center">
                <Video className="w-5 h-5 mr-3 text-primary-600" />
                Recordings
              </span>
              <ChevronDown
                className={`w-4 h-4 transform transition-transform ${
                  openDropdown === "recordings" ? "rotate-180" : ""
                }`}
              />
            </button>
            {openDropdown === "recordings" && (
              <div className="ml-8 space-y-1">
                {recordings.length > 0 ? (
                  recordings.map((r) => (
                    <Link
                      key={r._id}
                      to={`/student/recordings/${r._id}`}
                      className="block px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
                    >
                      {r.courseName}
                    </Link>
                  ))
                ) : (
                  <p className="px-3 py-2 text-xs text-gray-400 italic">No recordings available</p>
                )}
              </div>
            )}

            <NavItem to="/student/results" icon={BarChart3} label="Results" />
            <NavItem to="/student/orders" icon={ShoppingBag} label="Orders" />
            <NavItem to="/student/leaderboard" icon={Trophy} label="Leaderboard" />
            <NavItem to="/student/profile" icon={User} label="Profile" />
            <NavItem to="/student/contact" icon={Headphones} label="Contact" />
          </>
        ) : (
          <>
            <NavItem to="/admin" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/admin/companies" icon={Building} label="Companies" />
            <NavItem to="/admin/tests" icon={BookOpen} label="Tests" />
            <NavItem to="/admin/students" icon={Users} label="Students" />
            <NavItem to="/admin/results" icon={BarChart3} label="Results" />
            <NavItem to="/admin/payments" icon={DollarSign} label="Payments" />
            <NavItem to="/admin/settings" icon={Settings} label="Settings" />
          </>
        )}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {user?.name || (type === "admin" ? "Admin" : "Student")}
            </p>
            <p className="text-xs text-gray-500">
              {type === "admin" ? "Administrator" : "Student"}
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="text-sm text-red-600 hover:underline flex items-center"
        >
          <LogOut className="w-4 h-4 mr-1" /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;