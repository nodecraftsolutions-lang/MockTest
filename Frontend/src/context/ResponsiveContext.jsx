import { createContext, useContext, useState, useEffect } from 'react';
import { isMobile, isTablet, isDesktop, getCurrentBreakpoint } from '../utils/responsive';

const ResponsiveContext = createContext();

export const useResponsive = () => {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsive must be used within a ResponsiveProvider');
  }
  return context;
};

export const ResponsiveProvider = ({ children }) => {
  const [isMobileView, setIsMobileView] = useState(isMobile());
  const [isTabletView, setIsTabletView] = useState(isTablet());
  const [isDesktopView, setIsDesktopView] = useState(isDesktop());
  const [breakpoint, setBreakpoint] = useState(getCurrentBreakpoint());
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });
      setIsMobileView(isMobile());
      setIsTabletView(isTablet());
      setIsDesktopView(isDesktop());
      setBreakpoint(getCurrentBreakpoint());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const value = {
    isMobile: isMobileView,
    isTablet: isTabletView,
    isDesktop: isDesktopView,
    breakpoint,
    windowSize,
    // Helper functions
    isSmallScreen: () => isMobileView || isTabletView,
    isLargeScreen: () => isDesktopView,
    // Responsive classes
    containerClass: 'responsive-container',
    cardClass: 'responsive-card',
    buttonPrimaryClass: 'responsive-button responsive-button-primary',
    buttonSecondaryClass: 'responsive-button responsive-button-secondary'
  };

  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  );
};

export default ResponsiveContext;