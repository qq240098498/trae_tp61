/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        cream: {
          50: "#FCF9F2",
          100: "#F6F1E7",
          200: "#EFE7D5",
          300: "#E5DBC6",
          400: "#D6C7A6",
        },
        ink: {
          DEFAULT: "#1F1A17",
          soft: "#3D332C",
          muted: "#6B5D4F",
          faint: "#9A8B79",
        },
        terracotta: {
          50: "#FBF0EB",
          100: "#F4E2D8",
          200: "#E8C3AF",
          300: "#D89478",
          400: "#C75B39",
          500: "#B14A2D",
          600: "#923B22",
          700: "#6E2C19",
        },
        olive: {
          50: "#EFF1E2",
          100: "#E8EAD6",
          200: "#CFD6A8",
          300: "#9FAE6E",
          400: "#5C7A3A",
          500: "#48612D",
          600: "#374A23",
        },
        crimson: {
          50: "#FBEEEC",
          100: "#F2DBD7",
          200: "#E3AEA6",
          300: "#C76256",
          400: "#A52A1C",
          500: "#842116",
          600: "#5E1710",
        },
        amber2: {
          50: "#FBF3E3",
          100: "#F5E8CE",
          200: "#E8CE93",
          300: "#D6AE57",
          400: "#C7882A",
          500: "#A26C1E",
          600: "#7A5215",
        },
      },
      fontFamily: {
        display: ['"ZCOOL XiaoWei"', '"Noto Serif SC"', "serif"],
        serif: ['"Fraunces"', "Georgia", "serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(31,26,23,0.04), 0 8px 24px -12px rgba(31,26,23,0.10)",
        lift: "0 2px 4px rgba(31,26,23,0.05), 0 18px 40px -16px rgba(31,26,23,0.18)",
        inset: "inset 0 0 0 1px rgba(31,26,23,0.06)",
        stamp: "0 1px 0 rgba(31,26,23,0.05)",
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "stamp-in": {
          "0%": { opacity: "0", transform: "rotate(-12deg) scale(0.7)" },
          "60%": { opacity: "1", transform: "rotate(-4deg) scale(1.08)" },
          "100%": { opacity: "1", transform: "rotate(-3deg) scale(1)" },
        },
        "grow-bar": {
          "0%": { transform: "scaleY(0)" },
          "100%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both",
        "stamp-in": "stamp-in 0.45s cubic-bezier(0.22,1,0.36,1) both",
        "grow-bar": "grow-bar 0.7s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};
