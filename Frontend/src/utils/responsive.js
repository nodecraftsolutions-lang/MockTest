/**
 * Global responsive utility functions
 * Provides consistent responsive behavior across the entire application
 */

// Breakpoints matching Tailwind CSS defaults
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

/**
 * Get current breakpoint based on window width
 * @returns {string} Current breakpoint name
 */
export const getCurrentBreakpoint = () => {
  const width = window.innerWidth;
  
  if (width < breakpoints.sm) return 'xs';
  if (width < breakpoints.md) return 'sm';
  if (width < breakpoints.lg) return 'md';
  if (width < breakpoints.xl) return 'lg';
  if (width < breakpoints['2xl']) return 'xl';
  return '2xl';
};

/**
 * Check if current screen size is mobile
 * @returns {boolean} True if screen is mobile size
 */
export const isMobile = () => {
  return window.innerWidth < breakpoints.md;
};

/**
 * Check if current screen size is tablet
 * @returns {boolean} True if screen is tablet size
 */
export const isTablet = () => {
  const width = window.innerWidth;
  return width >= breakpoints.md && width < breakpoints.lg;
};

/**
 * Check if current screen size is desktop
 * @returns {boolean} True if screen is desktop size
 */
export const isDesktop = () => {
  return window.innerWidth >= breakpoints.lg;
};

/**
 * Add responsive classes to element based on screen size
 * @param {HTMLElement} element - Element to add classes to
 * @param {Object} classes - Classes for different breakpoints
 */
export const addResponsiveClasses = (element, classes) => {
  if (!element) return;
  
  // Clear existing responsive classes
  element.className = element.className.replace(/responsive-\S+/g, '');
  
  // Add classes based on current breakpoint
  const breakpoint = getCurrentBreakpoint();
  
  if (classes[breakpoint]) {
    element.classList.add(...classes[breakpoint].split(' '));
  }
  
  // Add general size classes
  if (isMobile()) {
    element.classList.add('responsive-mobile');
  } else if (isTablet()) {
    element.classList.add('responsive-tablet');
  } else {
    element.classList.add('responsive-desktop');
  }
};

/**
 * Create a responsive container with proper padding and max-width
 * @param {string} className - Additional classes to apply
 * @returns {string} Combined class names
 */
export const responsiveContainer = (className = '') => {
  return `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`;
};

/**
 * Create responsive grid classes
 * @param {Object} options - Grid options
 * @param {number} options.cols - Number of columns
 * @param {number} options.colsSm - Number of columns on small screens
 * @param {number} options.colsMd - Number of columns on medium screens
 * @param {number} options.colsLg - Number of columns on large screens
 * @param {number} options.gap - Gap between columns
 * @returns {string} Grid class names
 */
export const responsiveGrid = (options = {}) => {
  const {
    cols = 1,
    colsSm = cols,
    colsMd = cols,
    colsLg = cols,
    gap = 4
  } = options;
  
  return `
    grid
    grid-cols-${colsSm} 
    sm:grid-cols-${colsSm} 
    md:grid-cols-${colsMd} 
    lg:grid-cols-${colsLg}
    gap-${gap}
  `.replace(/\s+/g, ' ').trim();
};

/**
 * Create responsive text classes
 * @param {Object} options - Text options
 * @param {string} options.base - Base text size
 * @param {string} options.sm - Text size on small screens
 * @param {string} options.md - Text size on medium screens
 * @param {string} options.lg - Text size on large screens
 * @returns {string} Text class names
 */
export const responsiveText = (options = {}) => {
  const {
    base = 'base',
    sm = base,
    md = base,
    lg = base
  } = options;
  
  return `
    text-${sm} 
    sm:text-${sm} 
    md:text-${md} 
    lg:text-${lg}
  `.replace(/\s+/g, ' ').trim();
};

/**
 * Create responsive padding classes
 * @param {Object} options - Padding options
 * @param {string|number} options.x - Horizontal padding
 * @param {string|number} options.y - Vertical padding
 * @param {string|number} options.xSm - Horizontal padding on small screens
 * @param {string|number} options.ySm - Vertical padding on small screens
 * @param {string|number} options.xMd - Horizontal padding on medium screens
 * @param {string|number} options.yMd - Vertical padding on medium screens
 * @param {string|number} options.xLg - Horizontal padding on large screens
 * @param {string|number} options.yLg - Vertical padding on large screens
 * @returns {string} Padding class names
 */
export const responsivePadding = (options = {}) => {
  const {
    x = 0,
    y = 0,
    xSm = x,
    ySm = y,
    xMd = x,
    yMd = y,
    xLg = x,
    yLg = y
  } = options;
  
  return `
    px-${xSm} py-${ySm}
    sm:px-${xSm} sm:py-${ySm}
    md:px-${xMd} md:py-${yMd}
    lg:px-${xLg} lg:py-${yLg}
  `.replace(/\s+/g, ' ').trim();
};

/**
 * Create responsive margin classes
 * @param {Object} options - Margin options
 * @param {string|number} options.x - Horizontal margin
 * @param {string|number} options.y - Vertical margin
 * @param {string|number} options.xSm - Horizontal margin on small screens
 * @param {string|number} options.ySm - Vertical margin on small screens
 * @param {string|number} options.xMd - Horizontal margin on medium screens
 * @param {string|number} options.yMd - Vertical margin on medium screens
 * @param {string|number} options.xLg - Horizontal margin on large screens
 * @param {string|number} options.yLg - Vertical margin on large screens
 * @returns {string} Margin class names
 */
export const responsiveMargin = (options = {}) => {
  const {
    x = 0,
    y = 0,
    xSm = x,
    ySm = y,
    xMd = x,
    yMd = y,
    xLg = x,
    yLg = y
  } = options;
  
  return `
    mx-${xSm} my-${ySm}
    sm:mx-${xSm} sm:my-${ySm}
    md:mx-${xMd} md:my-${yMd}
    lg:mx-${xLg} lg:my-${yLg}
  `.replace(/\s+/g, ' ').trim();
};

/**
 * Create responsive hide/show classes
 * @param {Object} options - Visibility options
 * @param {boolean} options.mobile - Show on mobile
 * @param {boolean} options.tablet - Show on tablet
 * @param {boolean} options.desktop - Show on desktop
 * @returns {string} Visibility class names
 */
export const responsiveVisibility = (options = {}) => {
  const {
    mobile = true,
    tablet = true,
    desktop = true
  } = options;
  
  const classes = [];
  
  if (!mobile) classes.push('max-md:hidden');
  if (!tablet) classes.push('md:max-lg:hidden');
  if (!desktop) classes.push('lg:hidden');
  
  return classes.join(' ');
};

// Export all utilities as default
export default {
  breakpoints,
  getCurrentBreakpoint,
  isMobile,
  isTablet,
  isDesktop,
  addResponsiveClasses,
  responsiveContainer,
  responsiveGrid,
  responsiveText,
  responsivePadding,
  responsiveMargin,
  responsiveVisibility
};