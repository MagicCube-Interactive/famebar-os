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
        // Surface hierarchy (black + purple tonal layering)
        background: '#000000',
        surface: {
          DEFAULT: '#000000',
          dim: '#000000',
          bright: '#2a1a3e',
        },
        'surface-container': {
          lowest: '#050505',
          low: '#110a1a',
          DEFAULT: '#1a0f2e',
          high: '#241538',
          highest: '#2e1a45',
        },
        'surface-variant': '#2e1a45',
        'surface-tint': '#BD2C8C',

        // Primary (magenta/purple)
        primary: {
          DEFAULT: '#d64aab',
          container: '#BD2C8C',
          fixed: '#f0a0d4',
          'fixed-dim': '#d64aab',
        },
        'on-primary': '#ffffff',
        'on-primary-container': '#ffd6ef',

        // Secondary (cyan)
        secondary: {
          DEFAULT: '#00CCFF',
          container: '#0099cc',
          fixed: '#80dfff',
          'fixed-dim': '#00CCFF',
        },
        'on-secondary': '#003344',

        // Tertiary (coral)
        tertiary: {
          DEFAULT: '#F36782',
          container: '#e04060',
          fixed: '#ffb0c0',
          'fixed-dim': '#F36782',
        },
        'on-tertiary-container': '#4a0015',

        // Error
        error: {
          DEFAULT: '#ffb4ab',
          container: '#93000a',
        },
        'on-error': '#690005',
        'on-error-container': '#ffdad6',

        // On-surface
        'on-surface': '#e8e0f0',
        'on-surface-variant': '#BBCBD2',
        'on-background': '#e8e0f0',

        // Outline
        outline: {
          DEFAULT: '#7a5a8a',
          variant: '#3d2050',
        },

        // Inverse
        'inverse-surface': '#e8e0f0',
        'inverse-on-surface': '#1a0f2e',
        'inverse-primary': '#BD2C8C',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-archivo)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
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
