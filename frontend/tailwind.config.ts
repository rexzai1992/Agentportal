import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
    "../backend/**/*.{ts,tsx}",
    "../shared/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          emerald: "#10B981",
          slate: "#0F172A",
          amber: "#F59E0B",
          red: "#DC2626"
        }
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem"
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui"]
      }
    }
  },
  plugins: []
};

export default config;
