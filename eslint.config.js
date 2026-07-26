import base from "@vega/eslint-config/base";
import react from "@vega/eslint-config/react";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/coverage/**",
      "**/node_modules/**",
      "**/.turbo/**",
      "reports/**",
    ],
  },
  ...base,
  ...react,
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@vega/config/api",
              message: "Server configuration cannot enter the web dependency graph.",
            },
            {
              name: "@vega/config/collaboration",
              message: "Server configuration cannot enter the web dependency graph.",
            },
          ],
          patterns: [
            {
              group: ["node:*", "@nestjs/*", "@hocuspocus/*"],
              message: "Server-only modules cannot enter the web dependency graph.",
            },
            {
              group: ["@excalidraw/excalidraw", "@excalidraw/*"],
              message: "Excalidraw imports belong only in @vega/excalidraw-adapter.",
            },
            {
              group: ["@vega/test-utils", "@vega/test-utils/*"],
              message: "Production code cannot import test utilities.",
            }
          ]
        }
      ]
    }
  },
  {
    files: [
      "apps/**/*.{test,spec}.{ts,tsx}",
      "packages/**/*.{test,spec}.{ts,tsx}",
      "packages/test-utils/**/*.{ts,tsx}"
    ],
    rules: {
      "no-restricted-imports": "off"
    }
  },
  {
    files: ["packages/excalidraw-adapter/src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@vega/test-utils", "@vega/test-utils/*"],
              message: "Production code cannot import test utilities."
            }
          ]
        }
      ]
    }
  }
];
