/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        graphite: {
          50: '#F3F4F6',
          100: '#E4E6EA',
          200: '#C7CBD2',
          300: '#A0A6B0',
          400: '#727A87',
          500: '#535B68',
          600: '#3D4451',
          700: '#2C323C',
          800: '#1F242C',
          900: '#15181E',
          950: '#0D0F13',
        },
        porcelain: {
          DEFAULT: '#F7F7F8',
          dim: '#EEEFF1',
        },
        signal: {
          50: '#EEF2FF',
          100: '#DCE4FF',
          300: '#93A9FF',
          400: '#5C7CFF',
          500: '#3358F4',
          600: '#2444D6',
          700: '#1D37AD',
          900: '#141F63',
        },
        hazard: {
          50: '#FFF6E9',
          100: '#FEEACB',
          400: '#F3A335',
          500: '#E88C12',
          600: '#C6720A',
        },
        repair: {
          50: '#E9F8F2',
          100: '#CBEFE0',
          400: '#2FAF83',
          500: '#158F63',
          600: '#0F7350',
        },
        alert: {
          50: '#FDECEB',
          100: '#FAD1CD',
          400: '#E15D4C',
          500: '#D6432E',
          600: '#B33322',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 2px rgba(21, 24, 30, 0.04), 0 1px 12px rgba(21, 24, 30, 0.05)',
        raised: '0 4px 20px rgba(21, 24, 30, 0.09)',
        focus: '0 0 0 3px rgba(51, 88, 244, 0.25)',
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '10px',
        lg: '14px',
        xl: '20px',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        dial: {
          '0%': { strokeDashoffset: 'var(--dial-from)' },
          '100%': { strokeDashoffset: 'var(--dial-to)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.4s ease-out both',
        dial: 'dial 1s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
}
