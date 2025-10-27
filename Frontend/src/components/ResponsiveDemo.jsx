import { useResponsive } from '../hooks/useResponsive';
import { ResponsiveContainer, ResponsiveGrid, ResponsiveCard } from './ResponsiveWrapper';

/**
 * ResponsiveDemo Component
 * Demonstrates how to use the responsive utilities
 */
const ResponsiveDemo = () => {
  const { isMobile, isTablet, isDesktop, breakpoint } = useResponsive();

  return (
    <ResponsiveContainer className="py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Responsive Demo</h1>
        <p className="text-lg text-gray-600">
          Current breakpoint: <span className="font-semibold">{breakpoint}</span>
        </p>
        <div className="mt-4 flex justify-center space-x-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${isMobile ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
            Mobile: {isMobile ? 'Yes' : 'No'}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${isTablet ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            Tablet: {isTablet ? 'Yes' : 'No'}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDesktop ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
            Desktop: {isDesktop ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      <ResponsiveGrid cols={1} colsMd={2} colsLg={3} gap={6}>
        <ResponsiveCard className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Card 1</h2>
          <p className="text-gray-600">
            This card demonstrates responsive grid behavior. On mobile it takes full width, 
            on tablet it takes half width, and on desktop it takes one-third width.
          </p>
        </ResponsiveCard>

        <ResponsiveCard className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Card 2</h2>
          <p className="text-gray-600">
            Resize your browser window to see how the layout adapts to different screen sizes.
            The grid will automatically reflow based on the available space.
          </p>
        </ResponsiveCard>

        <ResponsiveCard className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Card 3</h2>
          <p className="text-gray-600">
            All responsive components use consistent styling and spacing that works well 
            across all device sizes.
          </p>
        </ResponsiveCard>
      </ResponsiveGrid>

      <div className="mt-8 text-center">
        <p className="text-gray-600">
          This demo shows how to use the responsive utilities to create a mobile-first, 
          responsive design that works across all device sizes.
        </p>
      </div>
    </ResponsiveContainer>
  );
};

export default ResponsiveDemo;