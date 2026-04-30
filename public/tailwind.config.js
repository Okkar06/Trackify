/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "24px",
    },
    extend: {
      colors: {
        trackify: {
          bg: "#0B0B0C",
          surface: "#121214",
          surface2: "#17171A",
          border: "#26262B",
          border2: "#2F2F36",
          text: "#FAFAFA",
          muted: "#A1A1AA",
          muted2: "#71717A",
        },
      },
      borderRadius: {
        card: "16px",
        control: "12px",
      },
    },
  },
  plugins: [],
};
