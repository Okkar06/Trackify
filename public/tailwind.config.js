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
          bg: "#0A0A0A",
          surface: "#181818",
          border: "#2A2A2A",
          text: "#FFFFFF",
          muted: "#A1A1A1",
        },
      },
      borderRadius: {
        card: "12px",
        control: "10px",
      },
    },
  },
  plugins: [],
};
