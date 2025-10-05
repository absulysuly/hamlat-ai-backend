/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Iraq Compass Glassmorphic Palette - Adapted for Campaign
        primary: {
          DEFAULT: '#6C2BD9', // Deep Cosmic Purple
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#6C2BD9',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b1a6d',
        },
        secondary: {
          DEFAULT: '#00D9FF', // Electric Cyan
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#00D9FF',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        accent: {
          DEFAULT: '#FF2E97', // Neon Pink
          50: '#fef1f7',
          100: '#fee5f0',
          200: '#fecce3',
          300: '#fda4ca',
          400: '#fb6ba8',
          500: '#FF2E97',
          600: '#db1872',
          700: '#be0a5d',
          800: '#9d0c4d',
          900: '#831043',
        },
        dark: {
          DEFAULT: '#0A0E27', // Dark Background
          50: '#1a1f3a',
          100: '#151a30',
          200: '#0f1326',
          300: '#0A0E27',
          400: '#080b1f',
          500: '#060917',
          600: '#04060f',
          700: '#020307',
          800: '#000000',
          900: '#000000',
        },
        // Campaign-specific colors
        success: {
          DEFAULT: '#10b981',
          light: '#34d399',
          dark: '#059669',
        },
        warning: {
          DEFAULT: '#f59e0b',
          light: '#fbbf24',
          dark: '#d97706',
        },
        danger: {
          DEFAULT: '#ef4444',
          light: '#f87171',
          dark: '#dc2626',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glass-lg': '0 12px 48px rgba(0, 0, 0, 0.4)',
        'glow-primary': '0 0 20px rgba(108, 43, 217, 0.4)',
        'glow-secondary': '0 0 20px rgba(0, 217, 255, 0.4)',
        'glow-accent': '0 0 20px rgba(255, 46, 151, 0.4)',
        'glow-primary-lg': '0 0 40px rgba(108, 43, 217, 0.6)',
        'glow-secondary-lg': '0 0 40px rgba(0, 217, 255, 0.6)',
        'glow-accent-lg': '0 0 40px rgba(255, 46, 151, 0.6)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.4)',
        'glow-warning': '0 0 20px rgba(245, 158, 11, 0.4)',
        'glow-danger': '0 0 20px rgba(239, 68, 68, 0.4)',
      },
      borderRadius: {
        'glass': '16px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(108, 43, 217, 0.4)' },
          '100%': { boxShadow: '0 0 40px rgba(108, 43, 217, 0.8)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      fontFamily: {
        arabic: ['Cairo', 'sans-serif'],
        kurdish: ['Noto Sans Arabic', 'sans-serif'],
        english: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
