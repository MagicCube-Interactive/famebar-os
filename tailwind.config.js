/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Surface hierarchy (tonal layering)
        background: '#0e131f',
        surface: {
          DEFAULT: '#0e131f',
          dim: '#0e131f',
          bright: '#343946',
        },
        'surface-container': {
          lowest: '#080e1a',
          low: '#161c28',
          DEFAULT: '#1a202c',
          high: '#242a36',
          highest: '#2f3542',
        },
        'surface-variant': '#2f3542',
        'surface-tint': '#ffb95f',

        // Primary (amber/gold)
        primary: {
          DEFAULT: '#ffc174',
          container: '#f59e0b',
          fixed: '#ffddb8',
          'fixed-dim': '#ffb95f',
        },
        'on-primary': '#472a00',
        'on-primary-container': '#613b00',

        // Secondary (emerald/green)
        secondary: {
          DEFAULT: '#4edea3',
          container: '#00a572',
          fixed: '#6ffbbe',
          'fixed-dim': '#4edea3',
        },
        'on-secondary': '#003824',

        // Tertiary (blue)
        tertiary: {
          DEFAULT: '#b6ccff',
          container: '#8ab0ff',
          fixed: '#d8e2ff',
          'fixed-dim': '#adc6ff',
        },
        'on-tertiary-container': '#00408f',

        // Error
        error: {
          DEFAULT: '#ffb4ab',
          container: '#93000a',
        },
        'on-error': '#690005',
        'on-error-container': '#ffdad6',

        // On-surface
        'on-surface': '#dde2f3',
        'on-surface-variant': '#d8c3ad',
        'on-background': '#dde2f3',

        // Outline
        outline: {
          DEFAULT: '#a08e7a',
          variant: '#534434',
        },

        // Inverse
        'inverse-surface': '#dde2f3',
        'inverse-on-surface': '#2b303d',
        'inverse-primary': '#855300',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.75rem',
        xl: '1rem',
      },
    },
  },
  plugins: [],
};
