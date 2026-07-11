/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ─── Marca TF Arrecada+ ───────────────────────────────
        brand: {
          50:  'var(--brand-50, #fce7f8)',
          100: 'var(--brand-100, #fad0f4)',
          200: 'var(--brand-200, #f5a2ea)',
          300: 'var(--brand-300, #ee65d9)',
          400: 'var(--brand-400, #e037c4)',
          500: 'var(--brand-500, #D312AE)', // primária
          600: 'var(--brand-600, #aa0e8b)',
          700: 'var(--brand-700, #870b6e)',
          800: 'var(--brand-800, #650a52)',
          900: 'var(--brand-900, #450738)',
          950: 'var(--brand-950, #2c0424)',
        },
        // ─── Tons neutros premium ─────────────────────────────
        neutral: {
          50:  '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        // ─── Estados dos números ──────────────────────────────
        status: {
          available: { DEFAULT: '#22c55e', light: '#dcfce7', dark: '#15803d' },
          reserved:  { DEFAULT: '#f59e0b', light: '#fef3c7', dark: '#b45309' },
          paid:      { DEFAULT: '#ef4444', light: '#fee2e2', dark: '#b91c1c' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft':    '0 2px 8px 0 rgba(0,0,0,0.06)',
        'medium':  '0 4px 16px 0 rgba(0,0,0,0.10)',
        'strong':  '0 8px 32px 0 rgba(0,0,0,0.14)',
        'brand':   '0 4px 20px 0 rgba(211,18,174,0.40)',
        'brand-lg':'0 8px 40px 0 rgba(211,18,174,0.28)',
      },
      animation: {
        'fade-in':      'fadeIn 0.4s ease-out',
        'slide-up':     'slideUp 0.4s ease-out',
        'slide-down':   'slideDown 0.3s ease-out',
        'scale-in':     'scaleIn 0.25s ease-out',
        'pulse-soft':   'pulseSoft 2s infinite',
        'shimmer':      'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                     to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { from: { opacity: '0', transform: 'translateY(-12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
        shimmer:   { from: { backgroundPosition: '-200% 0' }, to: { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
