import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: ["Janna LT", "Cairo", "Tajawal", "Arial", "sans-serif"],
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      keyframes: {
        "aurora-drift": {
          "0%": { opacity: "0.2", transform: "translate(0, 0) scale(1)" },
          "50%": { opacity: "0.34", transform: "translate(-2%, 1.5%) scale(1.04)" },
          "100%": { opacity: "0.24", transform: "translate(1.5%, -1%) scale(1.02)" },
        },
        "aurora-shift": {
          "0%": { transform: "translateX(-20%) rotate(0deg)" },
          "100%": { transform: "translateX(20%) rotate(360deg)" },
        },
      },
      animation: {
        "aurora-drift": "aurora-drift 28s ease-in-out infinite alternate",
        "aurora-shift": "aurora-shift 52s linear infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
