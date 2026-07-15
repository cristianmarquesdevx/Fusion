/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        brand: {
          DEFAULT: '#2F4A3E',
          strong: '#233A30',
          ink: '#FFFFFF',
          soft: '#E7EDE6',
          dark: '#6FA084',
          'dark-strong': '#8ABAA0',
          'dark-ink': '#0E1710',
          'dark-soft': '#1D2A21',
        },
        gold: {
          DEFAULT: '#9C7A3E',
          soft: '#F3EAD9',
          dark: '#D8B677',
          'dark-soft': '#2A2417',
        },
        rose: {
          DEFAULT: '#B14E3D',
          soft: '#F7E7E2',
          dark: '#E08D77',
          'dark-soft': '#2C1E19',
        },
        sage: {
          DEFAULT: '#4C7A5E',
          soft: '#E7EFE9',
          dark: '#84BB9B',
          'dark-soft': '#1A2A21',
        },
        ink: {
          DEFAULT: '#1C2620',
          soft: '#5B6459',
          faint: '#8A9186',
          dark: '#ECEAE0',
          'dark-soft': '#A2AA9C',
          'dark-faint': '#6E766A',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          2: '#F1F0EA',
          dark: '#161C15',
          'dark-2': '#1B221A',
        },
        border: {
          DEFAULT: '#E3E1D8',
          dark: '#2A332B',
        },
        bg: {
          DEFAULT: '#FAFAF8',
          dark: '#10140F',
        },
      },
      borderRadius: {
        sm: '8px',
        md: '14px',
        lg: '20px',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(28,38,32,0.07)',
        strong: '0 16px 60px rgba(28,38,32,0.14)',
        'dark-soft': '0 1px 2px rgba(0,0,0,0.35)',
        'dark-strong': '0 16px 60px rgba(0,0,0,0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease',
        'fade-in-up': 'fadeInUp 0.4s ease',
        'slide-down': 'slideDown 0.2s ease',
        'scale-in': 'scaleIn 0.2s ease',
        'pulse-dot': 'pulse 1.8s ease-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulse: {
          '0%': { transform: 'scale(0.6)', opacity: '0.6' },
          '100%': { transform: 'scale(1.9)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
