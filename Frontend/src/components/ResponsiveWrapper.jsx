import { useResponsive } from '../hooks/useResponsive';

/**
 * ResponsiveWrapper Component
 * A utility component that renders different content based on screen size
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to render on all screens
 * @param {React.ReactNode} props.mobile - Content to render only on mobile
 * @param {React.ReactNode} props.tablet - Content to render only on tablet
 * @param {React.ReactNode} props.desktop - Content to render only on desktop
 * @param {boolean} props.hideOnMobile - Whether to hide on mobile
 * @param {boolean} props.hideOnTablet - Whether to hide on tablet
 * @param {boolean} props.hideOnDesktop - Whether to hide on desktop
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 */
const ResponsiveWrapper = ({
  children,
  mobile,
  tablet,
  desktop,
  hideOnMobile = false,
  hideOnTablet = false,
  hideOnDesktop = false,
  className = '',
  style = {},
  ...props
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  // Determine what to render based on screen size
  let content = children;
  
  if (isMobile && mobile !== undefined) {
    content = mobile;
  } else if (isTablet && tablet !== undefined) {
    content = tablet;
  } else if (isDesktop && desktop !== undefined) {
    content = desktop;
  }
  
  // Determine visibility based on hide props
  let hidden = false;
  
  if (isMobile && hideOnMobile) {
    hidden = true;
  } else if (isTablet && hideOnTablet) {
    hidden = true;
  } else if (isDesktop && hideOnDesktop) {
    hidden = true;
  }
  
  if (hidden) {
    return null;
  }
  
  return (
    <div 
      className={className}
      style={style}
      {...props}
    >
      {content}
    </div>
  );
};

/**
 * ResponsiveContainer Component
 * A container that provides responsive padding and max-width
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to render
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 * @param {boolean} props.fluid - Whether container should be fluid (no max-width)
 */
export const ResponsiveContainer = ({ 
  children, 
  className = '', 
  style = {}, 
  fluid = false,
  ...props 
}) => {
  const classes = fluid 
    ? `responsive-container ${className}`.trim()
    : `responsive-container max-w-7xl mx-auto ${className}`.trim();
    
  return (
    <div 
      className={classes}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * ResponsiveGrid Component
 * A grid container with responsive columns
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to render
 * @param {number} props.cols - Number of columns (default: 1)
 * @param {number} props.colsSm - Number of columns on small screens
 * @param {number} props.colsMd - Number of columns on medium screens
 * @param {number} props.colsLg - Number of columns on large screens
 * @param {string} props.gap - Gap between columns (default: '4')
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 */
export const ResponsiveGrid = ({ 
  children, 
  cols = 1,
  colsSm,
  colsMd,
  colsLg,
  gap = '4',
  className = '',
  style = {},
  ...props 
}) => {
  // Default responsive column values
  const smCols = colsSm !== undefined ? colsSm : cols;
  const mdCols = colsMd !== undefined ? colsMd : cols;
  const lgCols = colsLg !== undefined ? colsLg : cols;
  
  const classes = `
    responsive-grid
    responsive-grid-cols-${smCols}
    sm:responsive-grid-cols-${smCols}
    md:responsive-grid-cols-${mdCols}
    lg:responsive-grid-cols-${lgCols}
    gap-${gap}
    ${className}
  `.replace(/\s+/g, ' ').trim();
  
  return (
    <div 
      className={classes}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * ResponsiveCard Component
 * A card component with responsive styling
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to render
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 */
export const ResponsiveCard = ({ 
  children, 
  className = '',
  style = {},
  ...props 
}) => {
  const classes = `responsive-card ${className}`.trim();
  
  return (
    <div 
      className={classes}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * ResponsiveButton Component
 * A button component with responsive sizing
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to render
 * @param {string} props.variant - Button variant ('primary' | 'secondary')
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 * @param {boolean} props.fullWidth - Whether button should take full width
 */
export const ResponsiveButton = ({ 
  children, 
  variant = 'primary',
  className = '',
  style = {},
  fullWidth = false,
  ...props 
}) => {
  const baseClasses = variant === 'secondary' 
    ? 'responsive-button responsive-button-secondary' 
    : 'responsive-button responsive-button-primary';
    
  const widthClass = fullWidth ? 'w-full' : '';
  
  const classes = `${baseClasses} ${widthClass} ${className}`.trim();
  
  return (
    <button 
      className={classes}
      style={style}
      {...props}
    >
      {children}
    </button>
  );
};

export default ResponsiveWrapper;