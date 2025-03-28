/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B1121',
        primary: {
          DEFAULT: '#6366f1',
          hover: '#4f46e5'
        },
        slate: {
          400: '#94a3b8',
          500: '#64748b',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a'
        }
      },
      container: {
        center: true,
        padding: '1rem',
        screens: {
          '2xl': '1400px',
        },
      },
      backdropBlur: {
        sm: '8px'
      }
    },
  },
  plugins: [],
} 