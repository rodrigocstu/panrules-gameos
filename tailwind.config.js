/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // ── Mobile-first breakpoints (EGC-8) ──────────────────────────────────
      // xs and sm target phone widths; md/lg/xl/2xl remain Tailwind defaults.
      screens: {
        xs: '375px', // iPhone SE / small Android (design floor)
        sm: '390px', // iPhone 14 / mid-range Android
      },

      // ── NORA Brand Palette (EGC-8) ────────────────────────────────────────
      colors: {
        primary: {
          DEFAULT: '#2563EB',
          light: '#3B82F6',
          dark: '#1D4ED8',
        },
        accent: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
          dark: '#D97706',
        },
        success: {
          DEFAULT: '#10B981',
          light: '#34D399',
          dark: '#047857',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#F87171',
          dark: '#B91C1C',
        },
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },

      // ── Spacing — touch targets (HIG / Material 44 px minimum) ───────────
      spacing: {
        touch: '2.75rem',     // 44 px
        'touch-lg': '3.5rem', // 56 px
      },

      // ── Mobile-first font scale (base viewport 375 px) ───────────────────
      // Prefixed 'mobile-' to avoid overriding Tailwind defaults used by
      // existing components (text-xs, text-sm … still resolve to Tailwind vals)
      fontSize: {
        'mobile-xs':   ['0.6875rem', { lineHeight: '1.5', letterSpacing: '0.01em' }], // 11 px
        'mobile-sm':   ['0.8125rem', { lineHeight: '1.5' }],                           // 13 px
        'mobile-base': ['0.9375rem', { lineHeight: '1.6' }],                           // 15 px
        'mobile-lg':   ['1.125rem',  { lineHeight: '1.4' }],                           // 18 px
        'mobile-xl':   ['1.375rem',  { lineHeight: '1.3' }],                           // 22 px
        'mobile-2xl':  ['1.75rem',   { lineHeight: '1.2' }],                           // 28 px
      },
    },
  },
  plugins: [],
};
