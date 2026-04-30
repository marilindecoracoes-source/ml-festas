import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  '#fdf9ee',
          100: '#f9f0d0',
          200: '#f3df9d',
          300: '#ecc85f',
          400: '#e6b030',
          500: '#C9A84C',
          600: '#b8911f',
          700: '#9a741a',
          800: '#7d5e1b',
          900: '#684e1a',
          DEFAULT: '#C9A84C',
          light: '#F0C040',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Space Grotesk', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-gold': 'linear-gradient(135deg, #C9A84C 0%, #F0C040 100%)',
      },
    },
  },
  plugins: [],
}
export default config
