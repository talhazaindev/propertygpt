import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#38a169", // Green for main elements
        "primary-light": "#9ae6b4", // Light green for backgrounds
        "primary-dark": "#2f855a", // Darker green for hover states
        secondary: "#805ad5", // Purple as complementary color
        "secondary-light": "#d6bcfa", // Light purple for accents
        admin: {
          primary: "#38a169", // Green
          secondary: "#805ad5", // Purple
          bg: "#f0fff4", // Lightest green background
          card: "#ffffff", // White card backgrounds
          accent: "#4c51bf", // Indigo accent color
          text: "#2d3748", // Dark text color
          "text-light": "#718096", // Light text color for subtitles
          success: "#48bb78", // Success color
          warning: "#ecc94b", // Warning color
          danger: "#f56565", // Danger color
        },
        accent: {
          DEFAULT: "#F59E0B", // Amber
          dark: "#D97706",
          light: "#FEF3C7",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config; 