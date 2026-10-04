const tok = (name) => `oklch(from var(--${name}) l c h / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}', './app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
      '6xl': '4rem',
    },
    borderRadius: {
      none: '0',
      sm: '0.375rem',
      DEFAULT: '0.5rem',
      md: '0.5rem',
      lg: '0.625rem',
      xl: '0.875rem',
      '2xl': '1.125rem',
      '3xl': '1.375rem',
      '4xl': '1.625rem',
      full: '9999px',
    },
    extend: {
      colors: {
        // Tinysoy UI tokens — values live in src/styles/global.css. Relative
        // colour syntax keeps Tailwind's `/50` opacity modifiers working.
        background: tok('background'),
        foreground: tok('foreground'),
        card: { DEFAULT: tok('card'), foreground: tok('card-foreground') },
        popover: {
          DEFAULT: tok('popover'),
          foreground: tok('popover-foreground'),
        },
        primary: {
          DEFAULT: tok('primary'),
          foreground: tok('primary-foreground'),
        },
        secondary: {
          DEFAULT: tok('secondary'),
          foreground: tok('secondary-foreground'),
        },
        muted: { DEFAULT: tok('muted'), foreground: tok('muted-foreground') },
        accent: {
          DEFAULT: tok('accent'),
          foreground: tok('accent-foreground'),
        },
        destructive: tok('destructive'),
        border: 'var(--border)',
        input: 'var(--input)',
        ring: tok('ring'),
        chart: {
          1: tok('chart-1'),
          2: tok('chart-2'),
          3: tok('chart-3'),
          4: tok('chart-4'),
          5: tok('chart-5'),
        },
        sidebar: tok('sidebar'),
        gray: {
          100: '#f7fafc',
          200: '#edf2f7',
          300: '#e2e8f0',
          400: '#cbd5e0',
          500: '#a0aec0',
          600: '#718096',
          700: '#4a5568',
          800: '#2d3748',
          900: '#1a202c',
        },
        blue: {
          100: '#ebf8ff',
          200: '#bee3f8',
          300: '#90cdf4',
          400: '#63b3ed',
          500: '#4299e1',
          600: '#3182ce',
          700: '#2b6cb0',
          800: '#2c5282',
          900: '#2a4365',
        },
      },
      height: {
        '90%': '90%',
      },
      spacing: {
        4.5: '1.125rem',
        5.5: '1.375rem',
        6.5: '1.625rem',
        7.5: '1.875rem',
        8.5: '2.125rem',
        9.5: '2.375rem',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        heading: ['var(--font-sans)'],
        thai: [
          'var(--font-plex-thai)',
          'var(--font-plex)',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      boxShadow: {
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
};
