import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontSize: {
        xs: ["0.8125rem", { lineHeight: "1.35rem" }],
        sm: ["0.9375rem", { lineHeight: "1.6rem" }],
        base: ["1rem", { lineHeight: "1.75rem" }],
        lg: ["1.125rem", { lineHeight: "1.85rem" }],
        xl: ["1.25rem", { lineHeight: "2rem" }],
      },
      colors: {
        gold: {
          DEFAULT: "var(--gold-primary)",
          bright: "var(--gold-bright)",
          action: "var(--gold-action)",
          actionHover: "var(--gold-action-hover)",
          pale: "var(--gold-pale)",
          dim: "var(--gold-dim)",
          ghost: "var(--gold-ghost)",
          glow: "var(--gold-glow)",
        },
        deep: "var(--bg-deep)",
        surface: "var(--bg-surface)",
        card: "var(--bg-card)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        border: "var(--bg-border)",
        "border-gold": "var(--border-gold)",
        red: "var(--red)",
        green: "var(--green)",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "6px",
      },
      animation: {
        shimmer: "shimmer 4s ease-in-out infinite",
        "fade-in": "fadeIn 0.6s ease-out",
        "slide-up": "slideUp 0.6s ease-out",
        "fade-in-up": "fadeInUp 0.6s ease-out both",
        "pulse-once": "pulseOnce 1.5s ease-out",
      },
      keyframes: {
        shimmer: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseOnce: {
          "0%": {
            boxShadow: "0 0 0 0 rgba(212, 168, 67, 0.4)",
          },
          "70%": {
            boxShadow: "0 0 0 12px rgba(212, 168, 67, 0)",
          },
          "100%": {
            boxShadow: "0 0 0 0 rgba(212, 168, 67, 0)",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
