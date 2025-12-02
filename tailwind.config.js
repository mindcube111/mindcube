/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // 启用深色模式
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#d9e0ff',
          200: '#b4c3ff',
          300: '#8ea5ff',
          400: '#6f88ff',
          500: '#4A6CF7',
          600: '#2f4ed2',
          700: '#233daa',
          800: '#1b2e82',
          900: '#121f5b',
        },
        secondary: {
          50: '#f5f0ff',
          100: '#e6dbff',
          200: '#ccb8ff',
          300: '#b295ff',
          400: '#9a78fa',
          500: '#8B5CF6',
          600: '#6d3fe0',
          700: '#552fb3',
          800: '#3b1f80',
          900: '#27134d',
        },
        background: '#F8FAFF',
        text: '#2D3B8B',
        success: '#10B981',
        successLight: '#D1FAE5',
        warning: '#F59E0B',
        warningLight: '#FEF3C7',
        danger: '#EF4444',
        dangerLight: '#FEE2E2',
        muted: '#E2E8F0',
        surface: '#FFFFFF',
        surfaceAlt: '#F4F6FF',
      },
    },
  },
  plugins: [],
}




