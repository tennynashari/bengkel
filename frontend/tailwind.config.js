/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
        },
        brand: {
          amber: '#f59e0b',
          cyan: '#06b6d4',
          red: '#ef4444',
        }
      }
    },
  },
  plugins: [],
}
