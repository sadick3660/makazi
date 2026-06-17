/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Primary brand — deep navy blue
        primary: {
          50:  "#e8edf5",
          100: "#c5d0e6",
          200: "#9fb0d4",
          300: "#7890c2",
          400: "#5a76b4",
          500: "#1B3A6B",   // main blue
          600: "#16316098",
          700: "#122756",
          800: "#0e1e44",
          900: "#091532",
          950: "#050d1f",
        },
        // Secondary — rich maroon
        maroon: {
          50:  "#fceaea",
          100: "#f7c8c8",
          200: "#f09898",
          300: "#e86767",
          400: "#de3a3a",
          500: "#800020",   // main maroon
          600: "#6e001b",
          700: "#5a0016",
          800: "#450011",
          900: "#2e000b",
          950: "#1a0006",
        },
        // Neutral slate
        surface: {
          50:  "#f8f9fc",
          100: "#f0f2f7",
          200: "#e2e6ef",
          300: "#c8cedc",
          400: "#9aa3b8",
          500: "#6b7491",
          600: "#4e5670",
          700: "#383e54",
          800: "#252a3b",
          900: "#141824",
          950: "#0b0d16",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 16px rgba(27,58,107,0.10)",
        "card-hover": "0 8px 32px rgba(27,58,107,0.18)",
        maroon: "0 4px 20px rgba(128,0,32,0.25)",
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #1B3A6B 0%, #0e1e44 50%, #800020 100%)",
        "card-gradient": "linear-gradient(180deg, rgba(27,58,107,0.04) 0%, rgba(255,255,255,0) 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in-right": "slideInRight 0.35s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:       { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp:      { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        slideInRight: { "0%": { opacity: "0", transform: "translateX(20px)" }, "100%": { opacity: "1", transform: "translateX(0)" } },
      },
    },
  },
  plugins: [],
};
