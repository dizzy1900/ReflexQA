import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Neutral scale in the spirit of Vercel/Linear: true black canvas, hairline borders, colour only for meaning.
        background: "#000000",
        card: "#0a0a0a",
        "card-border": "rgba(255,255,255,0.09)",
        "card-border-hover": "rgba(255,255,255,0.16)",
        elevated: "#111111",
        fg: {
          DEFAULT: "#ededed",
          muted: "#a1a1a1",
          subtle: "#6e6e6e",
        },
        accent: {
          DEFAULT: "#ededed",
          hover: "#ffffff",
        },
        success: "#3fb27f",
        warning: "#d9a03f",
        danger: "#e5484d",
        info: "#8f8f8f",
        vision: {
          nominal: "#ededed",
          fail: "#e5484d",
          healed: "#3fb27f",
        },
        // Terminal palette, desaturated: level colours only, everything else grey.
        ansi: {
          red: "#e5484d",
          green: "#3fb27f",
          yellow: "#d9a03f",
          blue: "#a1a1a1",
          magenta: "#a1a1a1",
          cyan: "#a1a1a1",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        lg: "0.375rem",
        xl: "0.5rem",
        "2xl": "0.625rem",
      },
      // No glows anywhere: the old glow utilities resolve to nothing so every use site goes flat at once.
      boxShadow: {
        "glow-accent": "none",
        "glow-success": "none",
        "glow-warning": "none",
        "glow-danger": "none",
        "glow-info": "none",
        "glow-purple": "none",
        "glow-vision-nominal": "none",
        "glow-vision-fail": "none",
        "glow-vision-healed": "none",
        frame: "none",
      },
    },
  },
  plugins: [],
};

export default config;
