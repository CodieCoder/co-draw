import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  ConfigurationError,
  parseWebConfiguration,
  type ConfigurationIssue,
} from "@vega/config/web";

import { App, type WebConfigurationState } from "./App.js";
import "./styles/global.css";

const resolveConfigurationState = (): WebConfigurationState => {
  try {
    const configuration = parseWebConfiguration(import.meta.env);

    if (
      (typeof __VITE_CANVAS_TEST_API_ENABLED__ !== "undefined"
        ? __VITE_CANVAS_TEST_API_ENABLED__
        : false) &&
      configuration.testApiEnabled
    ) {
      void import("./canvas-test-api/hook.js");
    }

    return {
      status: "ready",
      configuration,
    };
  } catch (error: unknown) {
    const issues: readonly ConfigurationIssue[] =
      error instanceof ConfigurationError
        ? error.issues
        : [{ path: "configuration", code: "INVALID_FORMAT" }];

    return { status: "error", issues };
  }
};

const rootElement = document.querySelector<HTMLDivElement>("#root");
if (rootElement === null) {
  throw new Error("Application root is unavailable.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App state={resolveConfigurationState()} />
  </StrictMode>,
);
