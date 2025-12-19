/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}",
    "./App.tsx",
  ],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        ess: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
        },
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        rotate: {
          to: { transform: "rotateY(360deg)" },
        },
      },
      animation: {
        "fade-in": "fade-in .3s ease-out both",
        "fade-in-up": "fade-in-up .3s ease-out both",
        rotate: "rotate 12s linear infinite",
      },
    },
  },
  plugins: [],
};
