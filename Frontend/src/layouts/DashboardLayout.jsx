import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";

const DashboardLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Initialize state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState !== null) {
      // Small delay to ensure DOM is fully loaded
      const timer = setTimeout(() => {
        setIsSidebarCollapsed(JSON.parse(savedState));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'sidebarCollapsed') {
        setIsSidebarCollapsed(JSON.parse(e.newValue || 'false'));
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsMobileSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle sidebar state changes
  const handleSidebarStateChange = (collapsed, mobileOpen) => {
    setIsSidebarCollapsed(collapsed);
    setIsMobileSidebarOpen(mobileOpen);
    // Save state to localStorage
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  };

  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      {/* Sidebar - Pass state handlers */}
      <Sidebar 
        type="student" 
        onStateChange={handleSidebarStateChange}
      />
      
      {/* Mobile Overlay */}
      {isMobile && isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-30 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main 
        className={`
          flex-1 transition-all duration-300 ease-in-out
          ${isMobile 
            ? 'ml-0' 
            : isSidebarCollapsed 
              ? 'ml-16' 
              : 'ml-64'
          }
          ${isMobile && isMobileSidebarOpen ? 'overflow-hidden' : ''}
        `}
      > 
        {/* Content Container */}
        <div className={`
          p-4 sm:p-6
        `}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;