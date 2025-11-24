import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

/**
 * SEO Component for managing meta tags dynamically
 * Uses React Helmet Async for better performance
 * 
 * @param {Object} props - SEO configuration
 * @param {string} props.title - Page title (will be appended with " | PrepZon")
 * @param {string} props.description - Meta description
 * @param {string} props.keywords - Comma-separated keywords
 * @param {string} props.canonical - Canonical URL
 * @param {string} props.ogImage - Open Graph image URL
 * @param {string} props.ogType - Open Graph type (default: website)
 * @param {Object} props.schema - JSON-LD structured data
 */
const SEO = ({
  title = 'PrepZon - Online Mock Test Platform for Students & Professionals',
  description = 'PrepZon is a comprehensive online mock test platform offering company-specific tests, courses, and recordings. Practice with real exam patterns and improve your skills.',
  keywords = 'online mock test, practice tests, company tests, exam preparation, student learning platform, online courses, test analytics, exam pattern practice, PrepZon, mock exams, competitive exams',
  canonical,
  ogImage = 'https://www.prepzon.com/Final.png',
  ogType = 'website',
  schema,
  noindex = false,
}) => {
  // Construct full title
  const fullTitle = title.includes('PrepZon') ? title : `${title} | PrepZon`;
  
  // Construct canonical URL
  const fullCanonical = canonical || `https://www.prepzon.com${window.location.pathname}`;

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
      <meta property="og:image" content={ogImage} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullCanonical} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      
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
