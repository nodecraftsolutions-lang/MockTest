import React from 'react';

const ColorTest = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Color Palette Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Primary Colors */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3">Primary Colors</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-16 h-8 bg-primary-50 rounded"></div>
              <span className="ml-2">Primary 50</span>
            </div>
            <div className="flex items-center">
              <div className="w-16 h-8 bg-primary-100 rounded"></div>
              <span className="ml-2">Primary 100</span>
            </div>
            <div className="flex items-center">
              <div className="w-16 h-8 bg-primary-200 rounded"></div>
              <span className="ml-2">Primary 200</span>
            </div>
            <div className="flex items-center">
              <div className="w-16 h-8 bg-primary-300 rounded"></div>
              <span className="ml-2">Primary 300</span>
            </div>
            <div className="flex items-center">
              <div className="w-16 h-8 bg-primary-400 rounded"></div>
              <span className="ml-2">Primary 400</span>
            </div>
            <div className="flex items-center">
              <div className="w-16 h-8 bg-primary-500 rounded"></div>
              <span className="ml-2">Primary 500</span>
            </div>
            <div className="flex items-center">
              <div className="w-16 h-8 bg-primary-600 rounded"></div>
              <span className="ml-2">Primary 600</span>
            </div>
            <div className="flex items-center">
              <div className="w-16 h-8 bg-primary-700 rounded"></div>
              <span className="ml-2">Primary 700</span>
            </div>
            <div className="flex items-center">
              <div className="w-16 h-8 bg-primary-800 rounded"></div>
              <span className="ml-2">Primary 800</span>
            </div>
            <div className="flex items-center">
              <div className="w-16 h-8 bg-primary-900 rounded"></div>
              <span className="ml-2">Primary 900</span>
            </div>
          </div>
        </div>
        
        {/* Secondary Colors */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3">Secondary Colors</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-16 h-8 bg-secondary-50 rounded"></div>
              <span className="ml-2">Secondary 50</span>
            </div>
            <div className="flex items-center">
              <div className="w-16 h-8 bg-secondary-100 rounded"></div>
              <span className="ml-2">Secondary 100</span>
            </div>
            <div className="flex items-center">
              <div className="w-16 h-8 bg-secondary-200 rounded"></div>
              <span className="ml-2">Secondary 200</span>
            </div>
            <div className="flex items-center">
              <div className="w-16 h-8 bg-secondary-300 rounded"></div>
              <span className="ml-2">Secondary 300</span>
            </div>
            <div className="flex items-center">
              <div className="w-16 h-8 bg-secondary-400 rounded"></div>
              <span className="ml-2">Secondary 400</span>
            </div>
            <div className="flex items-center">
              <div className="w-16 h-8 bg-secondary-500 rounded"></div>
              <span className="ml-2">Secondary 500</span>
            </div>
            <div className="flex items-center">
              <div className="w-16 h-8 bg-secondary-600 rounded"></div>
              <span className="ml-2">Secondary 600</span>
            </div>
            <div className="flex items-center">
              <div className="w-16 h-8 bg-secondary-700 rounded"></div>
              <span className="ml-2">Secondary 700</span>
            </div>
            <div className="flex items-center">
              <div className="w-16 h-8 bg-secondary-800 rounded"></div>
              <span className="ml-2">Secondary 800</span>
            </div>
            <div className="flex items-center">
              <div className="w-16 h-8 bg-secondary-900 rounded"></div>
              <span className="ml-2">Secondary 900</span>
            </div>
          </div>
        </div>
        
        {/* Text Colors */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-3">Text Colors</h2>
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="w-16 h-8 bg-background rounded border"></div>
              <span className="ml-2 text-foreground">Foreground</span>
            </div>
            <div className="flex items-center">
              <div className="w-16 h-8 bg-background rounded border"></div>
              <span className="ml-2 text-muted-foreground">Muted Foreground</span>
            </div>
            <div className="flex items-center">
              <div className="w-16 h-8 bg-background rounded border"></div>
              <span className="ml-2 bg-background">Background</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorTest;