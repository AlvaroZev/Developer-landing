/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Outfit", "Segoe UI", "sans-serif"],
        serif: ["Fraunces", "Palatino Linotype", "Palatino", "serif"],
      },
      maxWidth: { page: "1120px" },
    },
  },
  plugins: [],
};
