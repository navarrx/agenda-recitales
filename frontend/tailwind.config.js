/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef7ff',
          100: '#d8ecff',
          200: '#b9dcff',
          300: '#89c5ff',
          400: '#53a4ff',
          500: '#2d7fff',
          600: '#1c5dfa',
          700: '#1a4ae8',
          800: '#1c3dbd',
          900: '#1c3994',
        },
        secondary: {
          50: '#f6f8ff',
          100: '#edf0ff',
          200: '#dbe1ff',
          300: '#bfc8ff',
          400: '#9da2ff',
          500: '#837afd',
          600: '#7055f4',
          700: '#5e41e0',
          800: '#4d36b6',
          900: '#3f2e8c',
        },
        accent: {
          50: '#fbf1ff',
          100: '#f6e4ff',
          200: '#efcbff',
          300: '#e5a2ff',
          400: '#db69ff',
          500: '#d13df9',
          600: '#b921e8',
          700: '#9c1bc4',
          800: '#7f1a9f',
          900: '#691c7e',
        },
        neutral: {
          50: '#f6f7f9',
          100: '#ebedf2',
          200: '#d8dbe4',
          300: '#b5bacf',
          400: '#8d93b0',
          500: '#707694',
          600: '#5a5f7a',
          700: '#494c64',
          800: '#3e4054',
          900: '#383a48',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'soft': '0 2px 15px rgba(0, 0, 0, 0.05)',
        'hover': '0 10px 25px rgba(0, 0, 0, 0.1)',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      transitionDuration: {
        '400': '400ms',
      },
      transitionTimingFunction: {
        'bounce-in-out': 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
} 