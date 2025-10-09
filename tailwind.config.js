/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#F4F2FF",
          100: "#EAE6FF",
          200: "#D6D0FF",
          300: "#B9B0FF",
          400: "#9C8FFF",
          500: "#6B4EFF",
          600: "#5A3CE6",
          700: "#4A2ECC",
          800: "#3B25A3",
          900: "#2C1B7A",
        },
        secondary: {
          50: "#E6FBFF",
          100: "#C8F7FF",
          200: "#9FEFFF",
          300: "#70E3FF",
          400: "#3BD5FF",
          500: "#00D2FF",
          600: "#00B4E6",
          700: "#0096CC",
          800: "#0078B3",
          900: "#005C99",
        },
        accent: {
          orange: "#f97316",
          green: "#10b981",
        },
      },
      fontFamily: {
        sans: ["Roboto", "system-ui", "sans-serif"],
        heading: ["Poppins", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #6B4EFF 0%, #00D2FF 100%)",
        "gradient-secondary":
          "linear-gradient(135deg, #5A3CE6 0%, #4A2ECC 100%)",
        "gradient-hero": "linear-gradient(135deg, #6B4EFF 0%, #00D2FF 100%)",
      },
    },
  },
  plugins: [],
};
