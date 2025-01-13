/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",                // Add the path to your HTML file
    "./src/**/*.{html,js,jsx,ts,tsx}", // Recursively include all source files
  ],
  theme: {
    extend: {
      spacing: {
        "screen-with-nav": "var(--screen-height)",
        "nav": "var(--navbar-height)",
      }
    },
  },
  plugins: [],
}

