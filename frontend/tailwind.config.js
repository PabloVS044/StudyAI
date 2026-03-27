/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Custom dark palette consistent with original app design
        surface: {
          DEFAULT: "#17171f",
          2: "#1e1e28",
        },
      },
    },
  },
  plugins: [],
};
