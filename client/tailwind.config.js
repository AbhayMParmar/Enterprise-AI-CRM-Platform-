/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2563EB',
          secondary: '#1D4ED8',
          success: '#16A34A',
          textPrimary: '#0F172A',
          textSecondary: '#647488',
          border: '#E2E8F0',
          surface: '#FFFFFF',
          bg: '#F8FAFC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
