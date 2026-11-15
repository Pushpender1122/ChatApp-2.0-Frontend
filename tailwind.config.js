/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      // Semantic colours; the values switch between light and dark in index.css
      colors: {
        app: token('app'),
        surface: token('surface'),
        raised: token('raised'),
        line: token('line'),
        ink: token('ink'),
        muted: token('muted'),
        brand: token('brand'),
        'brand-strong': token('brand-strong'),
        'brand-soft': token('brand-soft'),
        'on-brand': token('on-brand'),
        danger: token('danger'),
        success: token('success'),
      },
    },
  },
  plugins: [],
}
