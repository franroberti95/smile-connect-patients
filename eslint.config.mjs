import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    ignores: ["src/components/ui/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXOpeningElement[name.name='input']",
          message: "Use shadcn Input component instead of native <input>.",
        },
        {
          selector: "JSXOpeningElement[name.name='select']",
          message: "Use shadcn Select component instead of native <select>.",
        },
        {
          selector: "JSXOpeningElement[name.name='textarea']",
          message: "Use shadcn Textarea component instead of native <textarea>.",
        },
      ],
    },
  },
]);

export default eslintConfig;
