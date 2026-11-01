/** @type {import('tailwindcss').Config} */
const iris = {
  50: '#f1f0ff', 100: '#e6e4ff', 200: '#cfcbff', 300: '#aea6ff', 400: '#8b7eff',
  500: '#6d5dfc', 600: '#5946ef', 700: '#4b37d4', 800: '#3f2fab', 900: '#352b86',
};
const mint = {
  400: '#34d8b4', 500: '#14c29a', 600: '#0ea07f', 700: '#0d8068',
};
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        // Fresh "Iris" theme: legacy gray/blue/pink/green utilities are remapped here
        gray: {
          50: '#f7f6ff', 100: '#efeefb', 200: '#e0def2', 300: '#bfbcdc', 400: '#938fb8',
          500: '#6f6b93', 600: '#3f3c60', 700: '#2b2947', 800: '#1d1c35', 900: '#121125',
        },
        blue: iris,
        pink: iris,
        indigo: iris,
        green: mint,
        cyan: mint,
      },
    },
  },
  plugins: [],
}
