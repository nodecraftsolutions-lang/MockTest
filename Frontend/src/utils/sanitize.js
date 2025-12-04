import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} html - The HTML content to sanitize
 * @returns {string} - Sanitized HTML content
 */
export const sanitizeHtml = (html) => {
  if (!html) return '';
  
  // Configure DOMPurify to allow common formatting but prevent scripts
  const config = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'span', 'div',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'blockquote', 'pre', 'code',
      'sub', 'sup',
      'a', 'img'
    ],
    ALLOWED_ATTR: [
      'class', 'style', 'href', 'target', 'rel',
      'src', 'alt', 'width', 'height',
      'colspan', 'rowspan'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    KEEP_CONTENT: true,
    RETURN_TRUSTED_TYPE: false
  };
  
  return DOMPurify.sanitize(html, config);
};

/**
 * Create sanitized HTML props for dangerouslySetInnerHTML
 * @param {string} html - The HTML content to sanitize
 * @returns {object} - Object with __html property containing sanitized HTML
 */
export const createSanitizedHtml = (html) => {
  return { __html: sanitizeHtml(html) };
};
