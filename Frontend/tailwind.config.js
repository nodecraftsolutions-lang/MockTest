/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary color - Trinidad (#f05a00)
        primary: {
          50: '#fef8f2',
          100: '#fce1c3',
          200: '#f9c996',
          300: '#f5ad70',
          400: '#f27915',
          500: '#f05a00',
          600: '#d44900',
          700: '#b03d00',
          800: '#8c3100',
          900: '#682500',
        },
        // Secondary color - Blue Whale (#05253d)
        secondary: {
          50: '#f0f4f7',
          100: '#d9e2e9',
          200: '#a2b0b9',
          300: '#7a8a99',
          400: '#4b677a',
          500: '#05253d',
          600: '#041f34',
          700: '#03192b',
          800: '#021321',
          900: '#010d17',
        },
        // Accent color - Tango (#f27915)
        accent: {
          500: '#f27915',
          600: '#d46300',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}