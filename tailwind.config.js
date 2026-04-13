/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#007AFF',
          dark: '#007AFF',
        },
        background: {
          DEFAULT: '#F2F2F7',
          dark: '#000000',
        },
        card: {
          DEFAULT: '#FFFFFF',
          dark: '#1C1C1E',
        },
        textSecondary: '#8E8E93',
      },
      borderRadius: {
        ios: '14px',
        card: '16px',
      },
    },
  },
  plugins: [],
};
