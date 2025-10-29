import { useState, useEffect } from 'react';
import { breakpoints, getCurrentBreakpoint, isMobile, isTablet, isDesktop } from '../utils/responsive';

/**
 * Custom hook for responsive design
 * Provides reactive screen size information and utility functions
 * 
 * @returns {Object} Responsive state and utility functions
 */
export const useResponsive = () => {
  const [isMobileView, setIsMobileView] = useState(isMobile());
  const [isTabletView, setIsTabletView] = useState(isTablet());
  const [isDesktopView, setIsDesktopView] = useState(isDesktop());
  const [breakpoint, setBreakpoint] = useState(getCurrentBreakpoint());
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    // Skip in server-side rendering
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({ width, height });
      setIsMobileView(isMobile());
      setIsTabletView(isTablet());
      setIsDesktopView(isDesktop());
      setBreakpoint(getCurrentBreakpoint());
    };

    // Set initial values
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Check if current screen size is smaller than specified breakpoint
   * @param {string} breakpointName - Breakpoint to compare against
   * @returns {boolean} True if current screen is smaller than breakpoint
   */
  const isSmallerThan = (breakpointName) => {
    const currentWidth = windowSize.width;
    const breakpointWidth = breakpoints[breakpointName];
    
    if (breakpointWidth === undefined) {
      console.warn(`Unknown breakpoint: ${breakpointName}`);
      return false;
    }
    
    return currentWidth < breakpointWidth;
  };

  /**
   * Check if current screen size is larger than specified breakpoint
   * @param {string} breakpointName - Breakpoint to compare against
   * @returns {boolean} True if current screen is larger than breakpoint
   */
  const isLargerThan = (breakpointName) => {
    const currentWidth = windowSize.width;
    const breakpointWidth = breakpoints[breakpointName];
    
    if (breakpointWidth === undefined) {
      console.warn(`Unknown breakpoint: ${breakpointName}`);
      return false;
    }
    
    return currentWidth >= breakpointWidth;
  };

  /**
   * Get responsive class names based on conditions
   * @param {Object} options - Class options
   * @param {string} options.mobile - Classes for mobile
   * @param {string} options.tablet - Classes for tablet
   * @param {string} options.desktop - Classes for desktop
   * @param {string} options.base - Base classes to always apply
   * @returns {string} Combined class names
   */
  const getResponsiveClass = (options = {}) => {
    const { mobile = '', tablet = '', desktop = '', base = '' } = options;
    let classes = base ? [base] : [];
    
    if (isMobileView && mobile) {
      classes.push(mobile);
    } else if (isTabletView && tablet) {
      classes.push(tablet);
    } else if (isDesktopView && desktop) {
      classes.push(desktop);
    }
    
    return classes.join(' ');
  };

  /**
   * Get responsive style properties
   * @param {Object} options - Style options
   * @param {any} options.mobile - Value for mobile
   * @param {any} options.tablet - Value for tablet
   * @param {any} options.desktop - Value for desktop
   * @returns {any} Appropriate value based on screen size
   */
  const getResponsiveValue = (options = {}) => {
    const { mobile, tablet, desktop } = options;
    
    if (isMobileView && mobile !== undefined) {
      return mobile;
    } else if (isTabletView && tablet !== undefined) {
      return tablet;
    } else if (isDesktopView && desktop !== undefined) {
      return desktop;
    }
    
    // Return first defined value as fallback
    return mobile !== undefined ? mobile : 
           tablet !== undefined ? tablet : 
           desktop !== undefined ? desktop : 
           undefined;
  };

  return {
    // Screen size information
    isMobile: isMobileView,
    isTablet: isTabletView,
    isDesktop: isDesktopView,
    breakpoint,
    windowSize,
    
    // Utility functions
    isSmallerThan,
    isLargerThan,
    getResponsiveClass,
    getResponsiveValue,
    
    // Shorthand helpers
    isSmallScreen: () => isMobileView || isTabletView,
    isLargeScreen: () => isDesktopView,
    
    // Common responsive values
    isLandscape: windowSize.width > windowSize.height,
    isPortrait: windowSize.width <= windowSize.height
  };
};

export default useResponsive;