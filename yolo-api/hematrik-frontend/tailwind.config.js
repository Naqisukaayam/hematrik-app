/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          green: '#16a34a',
          light: '#dcfce7',
          dark: '#14532d',
        }
      },
      keyframes: {
        fadeIn: {
          from: { opacity: 0, transform: 'translateY(6px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.25s ease forwards',
      }
    },
  },
  plugins: [],
}