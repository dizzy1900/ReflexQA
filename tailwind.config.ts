import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#070709",
        card: "#0f0f13",
        "card-border": "rgba(255,255,255,0.07)",
        "card-border-hover": "rgba(255,255,255,0.14)",
        elevated: "#16161c",
        fg: {
          DEFAULT: "#ededf0",
          muted: "#9a9aa6",
          subtle: "#62626e",
        },
        accent: {
          DEFAULT: "#6366f1",
          hover: "#7578f5",
        },
        success: "#34d399",
        warning: "#fbbf24",
        danger: "#f87171",
        info: "#60a5fa",
        // Meta Vision reticle states: nominal, regression point, healed node.
        vision: {
          nominal: "#06b6d4",
          fail: "#f43f5e",
          healed: "#10b981",
        },
        // Terminal palette: the bright ANSI colours, tuned to sit on the card surface.
        ansi: {
          red: "#fb7185",
          green: "#4ade80",
          yellow: "#fbbf24",
          blue: "#60a5fa",
          magenta: "#c084fc",
          cyan: "#22d3ee",
        },
      },
      fontFamily: {
        // The inline fallback keeps the declaration valid before next/font defines the variable.
        sans: ["var(--font-sans, Inter)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono, 'Geist Mono')", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        "glow-accent": "0 0 24px -4px rgba(99,102,241,0.55)",
        "glow-success": "0 0 24px -4px rgba(52,211,153,0.5)",
        "glow-warning": "0 0 24px -4px rgba(251,191,36,0.45)",
        "glow-danger": "0 0 24px -4px rgba(248,113,113,0.5)",
        "glow-info": "0 0 24px -4px rgba(96,165,250,0.5)",
        "glow-purple": "0 0 24px -4px rgba(192,132,252,0.5)",
        "glow-vision-nominal": "0 0 20px -2px rgba(6,182,212,0.55), inset 0 0 18px -8px rgba(6,182,212,0.5)",
        "glow-vision-fail": "0 0 20px -2px rgba(244,63,94,0.6), inset 0 0 18px -8px rgba(244,63,94,0.5)",
        "glow-vision-healed": "0 0 20px -2px rgba(16,185,129,0.55), inset 0 0 18px -8px rgba(16,185,129,0.5)",
        frame: "0 24px 80px -24px rgba(0,0,0,0.85)",
      },
    },
  },
  plugins: [],
};

export default config;
