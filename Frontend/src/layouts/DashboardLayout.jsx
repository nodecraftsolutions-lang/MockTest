import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";

const DashboardLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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