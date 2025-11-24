# SEO Component Usage Guide

## Overview

The SEO component provides a simple, reusable way to manage meta tags and structured data for each page in the PrepZon application. It uses `react-helmet-async` for better performance and server-side rendering support.

## Installation

The required dependencies have been installed:
```bash
npm install react-helmet-async
```

## Setup

The `HelmetProvider` has been added to `main.jsx` to wrap the entire application:

```jsx
import { HelmetProvider } from 'react-helmet-async'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>,
)
```

## Basic Usage

Import and use the SEO component at the top of your page component's return statement:

```jsx
import SEO from '../components/SEO';

function MyPage() {
  return (
    <div>
      <SEO
        title="My Page Title"
        description="My page description"
      />
      {/* Rest of your page content */}
    </div>
  );
}
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `title` | string | No | "PrepZon - Online Mock Test Platform..." | Page title (automatically appends " \| PrepZon" if not present) |
| `description` | string | No | Default description | Meta description (max 160 characters recommended) |
| `keywords` | string | No | Default keywords | Comma-separated keywords |
| `canonical` | string | No | Current page URL | Canonical URL for the page |
| `ogImage` | string | No | "https://www.prepzon.com/Final.png" | Open Graph image URL |
| `ogType` | string | No | "website" | Open Graph type (website, article, etc.) |
| `schema` | object | No | undefined | JSON-LD structured data object |
| `noindex` | boolean | No | false | If true, adds noindex/nofollow meta tag |

## Examples

### Example 1: Homepage

```jsx
import SEO from '../components/SEO';

function Home() {
  return (
    <div>
      <SEO
        title="PrepZon - Mock Tests, Courses & Exam Preparation Platform"
        description="Ace your exams with PrepZon! Access company-specific mock tests, online courses, live recordings, and leaderboards."
        keywords="mock tests online, exam preparation platform, company-specific tests, online learning courses"
        canonical="https://www.prepzon.com/"
        schema={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "PrepZon Home",
          "description": "Online mock test and course platform",
          "url": "https://www.prepzon.com/"
        }}
      />
      {/* Page content */}
    </div>
  );
}
```

### Example 2: Mock Tests Page

```jsx
import SEO from '../components/SEO';

function MockTests() {
  return (
    <div>
      <SEO
        title="Browse Mock Tests - Company-Specific Practice Tests"
        description="Explore hundreds of company-specific mock tests on PrepZon. Practice with real exam patterns from top companies."
        keywords="company mock tests, practice tests online, exam patterns, company-specific tests"
        canonical="https://www.prepzon.com/mock-tests"
        ogImage="https://www.prepzon.com/code.png"
        schema={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Mock Tests",
          "description": "Collection of company-specific mock tests"
        }}
      />
      {/* Page content */}
    </div>
  );
}
```

### Example 3: Course Detail Page

```jsx
import SEO from '../components/SEO';

function CourseDetail({ course }) {
  return (
    <div>
      <SEO
        title={`${course.title} - Online Course`}
        description={course.description}
        keywords={`${course.title}, online course, ${course.category}, learn ${course.title}`}
        canonical={`https://www.prepzon.com/student/courses/${course.id}`}
        ogImage={course.thumbnail}
        ogType="article"
        schema={{
          "@context": "https://schema.org",
          "@type": "Course",
          "name": course.title,
          "description": course.description,
          "provider": {
            "@type": "Organization",
            "name": "PrepZon",
            "sameAs": "https://www.prepzon.com"
          },
          "offers": {
            "@type": "Offer",
            "price": course.price,
            "priceCurrency": "INR"
          }
        }}
      />
      {/* Course content */}
    </div>
  );
}
```

### Example 4: About Page

```jsx
import SEO from '../components/SEO';

function About() {
  return (
    <div>
      <SEO
        title="About PrepZon - Leading Online Mock Test Platform"
        description="Learn about PrepZon's mission to help students succeed through quality mock tests, courses, and comprehensive exam preparation resources."
        keywords="about PrepZon, online learning platform, exam preparation, student success"
        canonical="https://www.prepzon.com/about"
        schema={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "About PrepZon",
          "description": "Information about PrepZon platform"
        }}
      />
      {/* About content */}
    </div>
  );
}
```

### Example 5: Admin/Private Page (No Index)

```jsx
import SEO from '../components/SEO';

function AdminDashboard() {
  return (
    <div>
      <SEO
        title="Admin Dashboard - Manage PrepZon Platform"
        description="Admin dashboard for managing PrepZon platform."
        noindex={true}
      />
      {/* Admin content */}
    </div>
  );
}
```

### Example 6: Blog Post with Article Schema

```jsx
import SEO from '../components/SEO';

function BlogPost({ post }) {
  return (
    <div>
      <SEO
        title={post.title}
        description={post.excerpt}
        keywords={post.tags.join(', ')}
        canonical={`https://www.prepzon.com/blog/${post.slug}`}
        ogImage={post.featuredImage}
        ogType="article"
        schema={{
          "@context": "https://schema.org",
          "@type": "Article",
          "headline": post.title,
          "description": post.excerpt,
          "image": post.featuredImage,
          "datePublished": post.publishedAt,
          "dateModified": post.updatedAt,
          "author": {
            "@type": "Person",
            "name": post.author.name
          },
          "publisher": {
            "@type": "Organization",
            "name": "PrepZon",
            "logo": {
              "@type": "ImageObject",
              "url": "https://www.prepzon.com/Final.png"
            }
          }
        }}
      />
      {/* Blog post content */}
    </div>
  );
}
```

## Schema Types Reference

### Common Schema Types

#### 1. WebPage (Default for most pages)
```javascript
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Page Name",
  "description": "Page description",
  "url": "https://www.prepzon.com/page"
}
```

#### 2. Course (For course pages)
```javascript
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Course Name",
  "description": "Course description",
  "provider": {
    "@type": "Organization",
    "name": "PrepZon"
  },
  "offers": {
    "@type": "Offer",
    "price": "99.99",
    "priceCurrency": "INR"
  }
}
```

#### 3. FAQPage (For FAQ sections)
```javascript
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Question text?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Answer text"
      }
    }
  ]
}
```

#### 4. BreadcrumbList (For navigation)
```javascript
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.prepzon.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Courses",
      "item": "https://www.prepzon.com/courses"
    }
  ]
}
```

## Best Practices

### 1. Title Tags
- Keep under 60 characters
- Include primary keyword at the beginning
- Make it unique for each page
- Include brand name at the end
- Be descriptive and compelling

**Good Examples:**
```
"Free Mock Tests - Practice Online | PrepZon"
"Web Development Course - Learn React & Node.js | PrepZon"
```

**Bad Examples:**
```
"PrepZon" (too short, not descriptive)
"This is the best online mock test platform in the world for students" (too long)
```

### 2. Meta Descriptions
- Keep between 150-160 characters
- Include primary keyword
- Include a call-to-action
- Make it compelling and informative
- Be unique for each page

**Good Example:**
```
"Access 500+ company-specific mock tests on PrepZon. Practice with real exam patterns, get instant results, and compete with peers. Start free today!"
```

**Bad Example:**
```
"Mock tests" (too short, not compelling)
```

### 3. Keywords
- Use 8-12 relevant keywords
- Separate with commas
- Include variations and long-tail keywords
- Prioritize by relevance

**Example:**
```
"online mock tests, company placement tests, practice exams, competitive exam prep, free tests, paid test series, exam preparation online, test analytics"
```

### 4. Canonical URLs
- Always use absolute URLs
- Use HTTPS
- Be consistent with www or non-www
- No trailing slashes inconsistency

**Good:**
```
"https://www.prepzon.com/mock-tests"
```

**Bad:**
```
"/mock-tests" (relative URL)
"http://prepzon.com/mock-tests/" (HTTP, inconsistent trailing slash)
```

### 5. Structured Data
- Use appropriate schema types
- Include all required properties
- Test with Google's Rich Results Test
- Keep data accurate and up-to-date

## Testing

### 1. Inspect Meta Tags
Open browser DevTools and check the `<head>` section to verify meta tags are applied correctly.

### 2. Google Rich Results Test
Test structured data: https://search.google.com/test/rich-results

### 3. Facebook Sharing Debugger
Test Open Graph tags: https://developers.facebook.com/tools/debug/

### 4. Twitter Card Validator
Test Twitter Cards: https://cards-dev.twitter.com/validator

## Common Issues and Solutions

### Issue 1: Title not updating
**Problem:** Title stays the same when navigating between pages.

**Solution:** Ensure `react-helmet-async` is properly installed and `HelmetProvider` wraps your app.

### Issue 2: Duplicate title tags
**Problem:** Multiple title tags appear in the `<head>`.

**Solution:** Remove hardcoded title from `index.html` or ensure only one SEO component per page.

### Issue 3: Schema validation errors
**Problem:** Google Rich Results Test shows errors.

**Solution:** Validate your schema object structure against https://schema.org documentation.

### Issue 4: Canonical URL incorrect
**Problem:** Canonical URL points to wrong page.

**Solution:** Always pass the full canonical URL explicitly rather than relying on `window.location`.

## Page-Specific Implementation Checklist

For each new page you create:

- [ ] Import SEO component
- [ ] Add unique title (50-60 characters)
- [ ] Add unique description (150-160 characters)
- [ ] Add relevant keywords (8-12)
- [ ] Set canonical URL
- [ ] Add appropriate structured data
- [ ] Set custom OG image if available
- [ ] Use noindex for admin/private pages
- [ ] Test with Google Rich Results
- [ ] Verify in browser DevTools

## Performance Tips

1. **Keep schema objects minimal** - Only include necessary properties
2. **Reuse common schema** - Create helper functions for frequently used schemas
3. **Lazy load images** - Don't include large images in OG tags
4. **Cache canonical URLs** - Calculate once per page load

## Additional Resources

- [React Helmet Async Documentation](https://github.com/staylor/react-helmet-async)
- [Schema.org Structured Data](https://schema.org)
- [Google Search Central](https://developers.google.com/search)
- [Open Graph Protocol](https://ogp.me/)
- [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)

---

**Last Updated:** 2025-11-24  
**Version:** 1.0  
**Maintained By:** PrepZon Development Team
