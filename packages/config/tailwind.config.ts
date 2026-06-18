import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export const sharedConfig: Partial<Config> = {
  darkMode: ["class"],
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
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        navy: {
          50: "#f0f4ff",
          100: "#dce6ff",
          200: "#c0d0ff",
          300: "#94b0ff",
          400: "#6082ff",
          500: "#3a55ff",
          600: "#2130ff",
          700: "#1a27e8",
          800: "#1721bc",
          900: "#0F172A",
          950: "#0a0f1e",
        },
        amber: {
          DEFAULT: "#F59E0B",
          50: "#fffbeb",
          100: "#fef3c7",
          500: "#F59E0B",
          600: "#d97706",
        },
        success: "#059669",
        error: "#EF4444",
        info: "#0284C7",
        subject: {
          english: "#3B82F6",
          maths: "#8B5CF6",
          science: "#10B981",
          tamil: "#F59E0B",
          music: "#EC4899",
          "martial-arts": "#EF4444",
          dance: "#F97316",
          art: "#06B6D4",
          coding: "#6366F1",
          default: "#64748B",
        },
      },
      borderRadius: {
        card: "12px",
        input: "8px",
        pill: "999px",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        heading: ["Outfit", ...fontFamily.sans],
        body: ["Inter", ...fontFamily.sans],
        sans: ["Inter", ...fontFamily.sans],
      },
      transitionDuration: {
        DEFAULT: "200ms",
        fast: "150ms",
        slow: "300ms",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.05), 0 4px 12px 0 rgba(0,0,0,0.04)",
        "card-hover": "0 4px 16px 0 rgba(0,0,0,0.08), 0 1px 4px 0 rgba(0,0,0,0.04)",
        subtle: "0 1px 2px 0 rgba(0,0,0,0.05)",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
  },
};
