/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // supports toggling admin dark mode
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#F8FBFF',
          sidebar: '#EEF5FF',
          primary: '#2563EB',
          secondary: '#3B82F6',
          lightBlue: '#93C5FD',
          veryLightBlue: '#DBEAFE',
          accent: '#60A5FA',
          success: '#22C55E',
          warning: '#F59E0B',
          danger: '#EF4444',
          card: '#FFFFFF',
          textPrimary: '#1E293B',
          textSecondary: '#64748B',
          border: '#E5E7EB',
        },
        // Dark mode equivalents
        dark: {
          bg: '#0F172A',
          sidebar: '#1E293B',
          card: '#1E293B',
          border: '#334155',
          textPrimary: '#F1F5F9',
          textSecondary: '#94A3B8',
        }
      },
      borderRadius: {
        'premium': '24px',
        'premium-sm': '16px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 10px 30px -10px rgba(37, 99, 235, 0.08)',
        'premium-hover': '0 20px 40px -15px rgba(37, 99, 235, 0.15)',
      }
    },
  },
  plugins: [],
}
