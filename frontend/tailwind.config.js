/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f6fe',
          100: '#e9edfc',
          200: '#cbd4fa',
          300: '#9eaff5',
          400: '#6981ed',
          500: '#445ee2',
          600: '#2e41ca',
          700: '#2532a8',
          800: '#232c8a',
          900: '#212971',
          950: '#141846',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
