import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import ResponsiveWrapper from './ResponsiveWrapper';

const Navbar = ({ isPublic = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  const handleCourses = () => {
    if (isAuthenticated) {
      // If user is logged in, go to student mock tests page
      navigate('/student/courses/');
    } else {
      // If user is not logged in, redirect to auth page
      // Store the redirect path in localStorage
      localStorage.setItem('redirectAfterLogin', '/student/courses/');
      navigate('/auth');
    }
  };

  const handleViewTests = () => {
    if (isAuthenticated) {
      // If user is logged in, go to student mock tests page
      navigate('/student/mock-tests');
    } else {
      // If user is not logged in, redirect to auth page
      // Store the redirect path in localStorage
      localStorage.setItem('redirectAfterLogin', '/student/mock-tests');
      navigate('/auth');
    }
  };
  
  const handleAllRecordings = () => {
    if (isAuthenticated) {
      // If user is logged in, go to student mock tests page
      navigate('/student/all-recordings');
    } else {
      // If user is not logged in, redirect to auth page
      // Store the redirect path in localStorage
      localStorage.setItem('redirectAfterLogin', '/student/all-recordings');
      navigate('/auth');
    }
  };

  const publicNavItems = [
    { name: 'Home', path: '/' },
    { name: 'Live Courses', action: handleCourses },
    { name: 'Recordings', action: handleAllRecordings  },
    { name: 'Mock Tests', action: handleViewTests },
    { name: 'About', path: '/about' },
    { name: 'Contact Us', path: '/contact' }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white backdrop-blur-sm border-b border-gray-200 shadow-sm">
      {/* Add this div to ensure proper sticky behavior on mobile */}
      <div className="w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link 
                to="/" 
                className="flex items-center space-x-3"
                onClick={() => {
                  // If we're already on the home page, scroll to top
                  if (window.location.pathname === '/') {
                    window.scrollTo(0, 0);
                  }
                }}
              >
                <img
                  src="/Final Logo.png"
                  alt="MockTest Pro Logo"
                  className="h-14 w-50"
                />
              </Link>
            </div>

            {/* Public Navigation - Desktop */}
            {isPublic && (
              <nav className="hidden md:flex md:space-x-1 ml-auto mr-10">
                {publicNavItems.map(item => (
                  item.path ? (
                    <Link
                      key={item.name}
                      to={item.path}
                      className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:text-primary-600 hover:bg-primary-50 transition-all duration-200"
                      onClick={() => {
                        // If this is the home link and we're already on the home page, scroll to top
                        if (item.path === '/' && window.location.pathname === '/') {
                          window.scrollTo(0, 0);
                        }
                      }}
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <button
                      key={item.name}
                      onClick={item.action}
                      className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:text-primary-600 hover:bg-primary-50 transition-all duration-200"
                    >
                      {item.name}
                    </button>
                  )
                ))}
              </nav>
            )}

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 focus:outline-none"
                  >
                    <div className="w-9 h-9 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="hidden md:flex items-center space-x-1">
                      <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </div>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg py-2 z-50 border border-gray-100 transform transition-all duration-200">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role || 'Student'}</p>
                      </div>
                      <Link
                        to={user?.role === 'admin' ? '/admin' : '/student'}
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/student/profile"
                        className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                      >
                        <Settings className="inline w-4 h-4 mr-2" />
                        Profile Settings
                      </Link>
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left block px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <LogOut className="inline w-4 h-4 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden md:flex md:items-center md:space-x-3">
                  <Link
                    to="/auth"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all"
                  >
                    Sign In
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              {isPublic && (
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                >
                  {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              )}
            </div>
          </div>

          {/* Mobile menu */}
          {isPublic && isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="px-2 space-y-1">
                {publicNavItems.map(item => (
                  item.path ? (
                    <Link
                      key={item.name}
                      to={item.path}
                      className="block px-4 py-3 text-base font-medium text-gray-700 rounded-lg hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      onClick={() => {
                        setIsMenuOpen(false);
                        // If this is the home link and we're already on the home page, scroll to top
                        if (item.path === '/' && window.location.pathname === '/') {
                          window.scrollTo(0, 0);
                        }
                      }}
                    >
                      {item.name}
                    </Link>
                  ) : (
                    <button
                      key={item.name}
                      onClick={() => {
                        setIsMenuOpen(false);
                        item.action();
                      }}
                      className="block w-full text-left px-4 py-3 text-base font-medium text-gray-700 rounded-lg hover:text-primary-600 hover:bg-primary-50 transition-colors"
                    >
                      {item.name}
                    </button>
                  )
                ))}
              </div>
              {!isAuthenticated && (
                <div className="mt-4 px-2">
                  <Link
                    to="/auth"
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-primary hover:bg-primary/90 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;