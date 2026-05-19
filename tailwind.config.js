/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: "#08111F",
          navy: "#0B1220",
          panel: "#101B2D",
          mist: "#F6FAFF",
          line: "#DDE7F3",
          violet: "#6B4EFF",
          cyan: "#00D2FF",
          emerald: "#10B981",
          orange: "#F97316",
        },
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
        "gradient-brand-radial":
          "radial-gradient(circle at 20% 20%, rgba(107,78,255,0.26), transparent 34%), radial-gradient(circle at 80% 10%, rgba(0,210,255,0.22), transparent 30%), linear-gradient(135deg, #08111F 0%, #0B1220 52%, #101B2D 100%)",
        "gradient-soft-panel":
          "linear-gradient(135deg, rgba(244,242,255,0.95) 0%, rgba(230,251,255,0.92) 100%)",
      },
      boxShadow: {
        "brand-sm": "0 12px 30px rgba(8,17,31,0.08)",
        "brand-md": "0 24px 60px rgba(8,17,31,0.12)",
        "brand-lg": "0 32px 90px rgba(8,17,31,0.16)",
      },
      borderRadius: {
        brand: "1.5rem",
        "brand-lg": "2rem",
      },
    },
  },
  plugins: [],
};
