import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

// SEO Configuration
const SEO_CONFIG = {
  brandName: 'PrepZon',
  defaultImage: '/Final.png',
  baseUrl: import.meta.env.VITE_APP_URL || 'https://www.prepzon.com',
};

/**
 * SEO Component for managing meta tags dynamically
 * Uses React Helmet Async for better performance
 * 
 * @param {Object} props - SEO configuration
 * @param {string} props.title - Page title (will be appended with " | PrepZon")
 * @param {string} props.description - Meta description
 * @param {string} props.keywords - Comma-separated keywords
 * @param {string} props.canonical - Canonical URL (can be relative or absolute)
 * @param {string} props.ogImage - Open Graph image URL
 * @param {string} props.ogType - Open Graph type (default: website)
 * @param {Object} props.schema - JSON-LD structured data
 * @param {boolean} props.noindex - Whether to add noindex meta tag
 */
const SEO = ({
  title = `${SEO_CONFIG.brandName} - Online Mock Test Platform for Students & Professionals`,
  description = `${SEO_CONFIG.brandName} is a comprehensive online mock test platform offering company-specific tests, courses, and recordings. Practice with real exam patterns and improve your skills.`,
  keywords = 'online mock test, practice tests, company tests, exam preparation, student learning platform, online courses, test analytics, exam pattern practice, PrepZon, mock exams, competitive exams',
  canonical,
  ogImage = SEO_CONFIG.defaultImage,
  ogType = 'website',
  schema,
  noindex = false,
}) => {
  // Construct full title
  const fullTitle = title.includes(SEO_CONFIG.brandName) ? title : `${title} | ${SEO_CONFIG.brandName}`;
  
  // Construct canonical URL - support both relative and absolute URLs
  const fullCanonical = canonical 
    ? (canonical.startsWith('http') ? canonical : `${SEO_CONFIG.baseUrl}${canonical}`)
    : `${SEO_CONFIG.baseUrl}${typeof window !== 'undefined' ? window.location.pathname : '/'}`;

  // Construct full image URL if relative
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${SEO_CONFIG.baseUrl}${ogImage}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Robots */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonical} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullOgImage} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonical} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullOgImage} />
      
      {/* Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

SEO.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  keywords: PropTypes.string,
  canonical: PropTypes.string,
  ogImage: PropTypes.string,
  ogType: PropTypes.string,
  schema: PropTypes.object,
  noindex: PropTypes.bool,
};

export default SEO;
export { SEO_CONFIG };
