import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: { extend: { colors: { brand: { 500: "#0078d4", 600: "#0063b1", 700: "#004f91" } } } },
  plugins: []
};
export default config;
