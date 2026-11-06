/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Colours are CSS variables (values in app/globals.css) so the admin can switch
      // to its light theme; the public site always uses the dark values.
      colors: {
        offblack:  'rgb(var(--c-offblack) / <alpha-value>)',
        ink:       'rgb(var(--c-ink) / <alpha-value>)',
        inklight:  'rgb(var(--c-inklight) / <alpha-value>)',
        gold:      'rgb(var(--c-gold) / <alpha-value>)',
        goldpale:  'rgb(var(--c-goldpale) / <alpha-value>)',
        // Three text roles: ghost (primary), soft (secondary), muted (meta)
        muted:     'rgb(var(--c-muted) / <alpha-value>)',
        soft:      'rgb(var(--c-soft) / <alpha-value>)',
        ghost:     'rgb(var(--c-ghost) / <alpha-value>)',
        // "white" is the ink of hairlines and highlights: black in the light admin
        white:     'rgb(var(--c-white) / <alpha-value>)',
      },
      // One easing curve for every transition and entrance
      transitionTimingFunction: {
        brand: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans:    ['Satoshi', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        label: '0.30em',
        logo:  '0.40em',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      },
      animation: {
        marquee: 'marquee 20s linear infinite reverse',
      }
    },
  },
  plugins: [],
}
