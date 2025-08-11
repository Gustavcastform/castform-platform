/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        display: [
          'Lexend',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      colors: {
        primary: {
          DEFAULT: '#3B5BDB', // deep indigo
          light: '#5C7CFA',
          dark: '#364FC7',
        },
        accent: {
          DEFAULT: '#845EF7', // purple accent
          light: '#B197FC',
          dark: '#5F3DC4',
        },
        success: {
          DEFAULT: '#12B886',
          light: '#69DB7C',
          dark: '#099268',
        },
        warning: {
          DEFAULT: '#FAB005',
          light: '#FFD43B',
          dark: '#E67700',
        },
        error: {
          DEFAULT: '#FA5252',
          light: '#FF8787',
          dark: '#C92A2A',
        },
        background: {
          DEFAULT: '#F8FAFC',
          dark: '#181A1B',
        },
        muted: {
          DEFAULT: '#868E96',
          dark: '#495057',
        },
      },
      animation: {
        'marquee-infinite': 'marquee-infinite 30s linear infinite',
      },
      keyframes: {
        'marquee-infinite': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
} 