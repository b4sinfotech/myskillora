import type { Config } from "tailwindcss";
import { sharedConfig } from "@myskillora/config/tailwind";

const config: Config = {
  ...sharedConfig,
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  plugins: [require("tailwindcss-animate")],
};

export default config;
