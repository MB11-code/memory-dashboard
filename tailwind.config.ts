import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: { amber: { 500: "#F59E0B" } },
    },
  },
  plugins: [],
};
export default config;
