/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        canopy: "#1f6f54",
        moss: "#dbe7d2",
        amberline: "#d99722",
        ink: "#16201d",
      },
    },
  },
  plugins: [],
};
