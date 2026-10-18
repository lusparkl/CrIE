import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101012",
        navy: "#1a1b1f",
        coral: "#8b5cf6",
        canvas: "#f6f6f7",
        sage: "#36b37e",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,.08), 0 16px 48px rgba(0,0,0,.12)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
