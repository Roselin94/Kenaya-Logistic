/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070D18',
          900: '#0B192C',
          800: '#1E3E62',
          700: '#2A5280',
          600: '#3B6B9F',
          100: '#E8EEF5',
          50: '#F4F7FB'
        },
        gold: {
          600: '#D97706',
          500: '#F59E0B',
          400: '#FBBF24',
          300: '#FCD34D',
          100: '#FEF3C7',
          50: '#FFFBEB'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    },
  },
  plugins: [],
}

