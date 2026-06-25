import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  {
    plugins: {
      "react-hooks": pluginReactHooks,
    },
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/no-require-imports": "error",
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next.config.mjs",
      "postcss.config.js",
      "tailwind.config.ts",
    ],
  }
);
