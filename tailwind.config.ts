import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        "3xl": "1920px",
        "4xl": "2560px",
        "8k": "3840px",
      },
      maxWidth: {
        // Fluid content wall: replaces static max-w-6xl-style caps so
        // primary section wrappers grow with the viewport instead of
        // stranding themselves at ~1152px on ultra-wide/4K/8K displays.
        content: "min(94vw, 100rem)",
        wide: "min(96vw, 130rem)",
      },
    },
  },
  plugins: [],
};

export default config;
