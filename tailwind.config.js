/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        offblack:  '#0a0a0a',
        ink:       '#111111',
        inklight:  '#1a1a1a',
        gold:      '#ffffff',
        goldpale:  '#f1f1f1',
        muted:     '#888888',
        ghost:     '#f4f4f4',
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
