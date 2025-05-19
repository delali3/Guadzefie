/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Theme classes
    'dark',
    'light',
    'bg-dark',
    'bg-light',
    'theme-bg',
    'theme-card',
    'theme-text',
    'theme-border',
    'theme-text-secondary'
  ],
  darkMode: 'class', // This enables class-based dark mode
  theme: {
    extend: {
      colors: {
        green: {
          '50': '#f0fdf4',
          '100': '#dcfce7',
          '200': '#bbf7d0',
          '300': '#86efac',
          '400': '#4ade80',
          '500': '#22c55e',
          '600': '#16a34a',
          '700': '#15803d',
          '800': '#166534',
          '900': '#14532d',
          '950': '#052e16',
        },
        light: '#f9fafb',
        dark: '#111827',
      },
    },
  },
  plugins: [],
} 