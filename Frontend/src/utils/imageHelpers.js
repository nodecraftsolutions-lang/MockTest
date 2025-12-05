/**
 * Image utility functions for consistent image rendering across components
 */

/**
 * Generates inline styles for image rendering with positioning and dimensions
 * @param {string} align - Image alignment ('left', 'center', 'right', or null)
 * @param {number} width - Image width (percentage or pixels based on isPercentage)
 * @param {number} height - Image height in pixels
 * @param {boolean} isPercentage - Whether width should be treated as percentage (default: true)
 * @returns {Object} Style object for React inline styles
 */
export const getImageStyles = (align, width, height, isPercentage = true) => ({
  width: width ? (isPercentage ? `${width}%` : `${width}px`) : '100%',
  height: height ? `${height}px` : 'auto',
  maxWidth: '100%',
  float: align || 'none',
  margin: align === 'left' ? '0 1rem 1rem 0' : 
          align === 'right' ? '0 0 1rem 1rem' : 
          '0 auto',
  display: align === 'center' ? 'block' : 'inline'
});

/**
 * Generates margin style for image alignment without float
 * Useful for images within flex or block containers
 * @param {string} align - Image alignment ('left', 'center', 'right')
 * @returns {string} Margin value for inline styles
 */
export const getImageMarginStyle = (align) => {
  if (align === 'center') return '0 auto';
  if (align === 'right') return '0 0 0 auto';
  return '0'; // left or default
};
