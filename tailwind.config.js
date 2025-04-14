/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0052CC",
          dark: "#003D99",
        },
        secondary: {
          DEFAULT: "#FF5630",
          dark: "#E64B2B",
        },
      },
    },
  },
  plugins: [],
};