/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: "#191919",
        secondary: "#1D211C",
        accent: "#314B3C",
        'primary-light': "#F5F5F5",
        'secondary-light': "#FFFFFF",
        'accent-light': "#4A7C59",
      },
    },
  },
  plugins: [],
};
