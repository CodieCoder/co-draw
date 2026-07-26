import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      },
      parserOptions: {
        projectService: {
          allowDefaultProject: ["src/*.test.ts"]
        },
        tsconfigRootDir: process.cwd()
      }
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          "fixStyle": "inline-type-imports"
        }
      ],
      "@typescript-eslint/no-import-type-side-effects": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_"
        }
      ],
      "no-restricted-imports": [
        "error",
        {
          "patterns": [
            {
              "group": ["@excalidraw/excalidraw", "@excalidraw/*"],
              "message": "Excalidraw imports belong only in @vega/excalidraw-adapter."
            },
            {
              "group": ["@vega/test-utils", "@vega/test-utils/*"],
              "message": "Production code cannot import test utilities."
            }
          ]
        }
      ]
    }
  },
  {
    ...tseslint.configs.disableTypeChecked,
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
];
