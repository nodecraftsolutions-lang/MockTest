/**
 * Image utility functions for consistent image handling across components
 */

/**
 * Constructs a complete image URL from a relative path
 * Handles both relative and absolute URLs appropriately
 * @param {string} url - The image URL (relative or absolute)
 * @returns {string} Complete image URL
 */
export const constructImageUrl = (url) => {
  if (!url) return '';
  // If it's already a full URL, return as is
  if (url.startsWith('http')) {
    return url;
  }
  // Otherwise prepend the API URL
  const apiUrl = import.meta.env.VITE_API_URL || (window.location.protocol + '//' + window.location.host);
  return `${apiUrl}${url}`;
};