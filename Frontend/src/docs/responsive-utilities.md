# Responsive Utilities Documentation

This document explains how to use the responsive utilities provided in the MockTest application to ensure consistent mobile responsiveness across all pages and components.

## Overview

The responsive utilities consist of:

1. **CSS Classes** - Global responsive styles in `src/styles/responsive.css`
2. **JavaScript Utilities** - Helper functions in `src/utils/responsive.js`
3. **React Hooks** - `useResponsive` hook in `src/hooks/useResponsive.js`
4. **React Context** - `ResponsiveContext` in `src/context/ResponsiveContext.jsx`
5. **React Components** - Wrapper components in `src/components/ResponsiveWrapper.jsx`

## Installation

The responsive utilities are automatically available throughout the application. The main CSS file is imported in `src/index.css`, and the context provider is included in `src/App.jsx`.

## Usage Examples

### 1. Using the Responsive Hook

```jsx
import { useResponsive } from '../hooks/useResponsive';

const MyComponent = () => {
  const { isMobile, isTablet, isDesktop, breakpoint } = useResponsive();
  
  return (
    <div>
      {isMobile && <MobileContent />}
      {isTablet && <TabletContent />}
      {isDesktop && <DesktopContent />}
      
      <p>Current breakpoint: {breakpoint}</p>
    </div>
  );
};
```

### 2. Using Responsive Components

```jsx
import { ResponsiveContainer, ResponsiveGrid, ResponsiveCard } from '../components/ResponsiveWrapper';

const MyPage = () => {
  return (
    <ResponsiveContainer>
      <h1>Responsive Page</h1>
      
      <ResponsiveGrid cols={1} colsMd={2} colsLg={3}>
        <ResponsiveCard>
          <h2>Card 1</h2>
          <p>Content here</p>
        </ResponsiveCard>
        
        <ResponsiveCard>
          <h2>Card 2</h2>
          <p>Content here</p>
        </ResponsiveCard>
      </ResponsiveGrid>
    </ResponsiveContainer>
  );
};
```

### 3. Using Responsive Utility Functions

```jsx
import { responsiveGrid, responsiveText, responsivePadding } from '../utils/responsive';

const MyComponent = () => {
  const gridClasses = responsiveGrid({ cols: 1, colsMd: 2, colsLg: 3 });
  const textClasses = responsiveText({ base: 'base', md: 'lg', lg: 'xl' });
  const paddingClasses = responsivePadding({ x: 4, y: 2, xMd: 6, yMd: 4 });
  
  return (
    <div className={`${gridClasses} ${textClasses} ${paddingClasses}`}>
      Responsive content
    </div>
  );
};
```

### 4. Using CSS Classes Directly

```jsx
const MyComponent = () => {
  return (
    <div className="responsive-container">
      <div className="responsive-grid responsive-grid-cols-1 md:responsive-grid-cols-2 lg:responsive-grid-cols-3">
        <div className="responsive-card">
          Card content
        </div>
      </div>
    </div>
  );
};
```

## Available Utilities

### CSS Classes

- `.responsive-container` - Container with responsive padding
- `.responsive-grid` - Grid container with responsive columns
- `.responsive-card` - Card with responsive styling
- `.responsive-button` - Button with responsive sizing
- Responsive visibility classes:
  - `.responsive-hide-mobile`
  - `.responsive-hide-tablet`
  - `.responsive-hide-desktop`

### JavaScript Functions

- `getCurrentBreakpoint()` - Get current screen breakpoint
- `isMobile()` - Check if screen is mobile size
- `isTablet()` - Check if screen is tablet size
- `isDesktop()` - Check if screen is desktop size
- `responsiveGrid()` - Generate responsive grid classes
- `responsiveText()` - Generate responsive text classes
- `responsivePadding()` - Generate responsive padding classes
- `responsiveMargin()` - Generate responsive margin classes

### React Hook

The `useResponsive` hook provides:

- `isMobile` - Boolean for mobile screen size
- `isTablet` - Boolean for tablet screen size
- `isDesktop` - Boolean for desktop screen size
- `breakpoint` - Current breakpoint name
- `windowSize` - Current window dimensions
- `isSmallerThan(breakpoint)` - Check if screen is smaller than breakpoint
- `isLargerThan(breakpoint)` - Check if screen is larger than breakpoint
- `getResponsiveClass(options)` - Get classes based on screen size
- `getResponsiveValue(options)` - Get value based on screen size

### React Components

- `<ResponsiveContainer>` - Responsive container wrapper
- `<ResponsiveGrid>` - Responsive grid container
- `<ResponsiveCard>` - Responsive card component
- `<ResponsiveButton>` - Responsive button component

## Best Practices

1. **Use the hook for logic** - Use `useResponsive` when you need to change behavior based on screen size
2. **Use components for layout** - Use responsive components for consistent styling
3. **Use CSS classes for simple cases** - Use utility classes for straightforward responsive styling
4. **Test on all devices** - Always test your implementation on mobile, tablet, and desktop
5. **Follow mobile-first approach** - Start with mobile styles and enhance for larger screens

## Customization

To customize the responsive behavior:

1. Modify breakpoints in `src/utils/responsive.js`
2. Add new utility classes in `src/styles/responsive.css`
3. Extend components in `src/components/ResponsiveWrapper.jsx`

## Troubleshooting

### Common Issues

1. **Styles not applying** - Ensure `src/styles/responsive.css` is imported in `src/index.css`
2. **Context not available** - Ensure `ResponsiveProvider` is included in `src/App.jsx`
3. **Incorrect breakpoint detection** - Check that breakpoints in `src/utils/responsive.js` match your design

### Browser Support

The responsive utilities work in all modern browsers. For older browsers, you may need to add polyfills for:

- `window.matchMedia`
- `ResizeObserver` (if used in future enhancements)

## Future Enhancements

Planned improvements:

1. Add dark mode support
2. Implement responsive image components
3. Add responsive typography scales
4. Create responsive navigation components
5. Add server-side rendering support