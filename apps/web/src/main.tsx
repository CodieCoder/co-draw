import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ConfigurationError,
  parseWebConfiguration,
} from "@vega/config/web";

import { App, type WebConfigurationState } from "./App.js";
import { configureApiClient } from "./api.js";
import { GuestPage } from "./GuestPage.js";
import { HomePage } from "./HomePage.js";
import { InvitePage } from "./InvitePage.js";
import { RoomPage } from "./RoomPage.js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 30_000,
    },
  },
});

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
const root = createRoot(rootElement);

const renderFailure = (state: WebConfigurationState): void => {
  root.render(
    <StrictMode>
      <App state={state} />
    </StrictMode>,
  );
};

const bootstrap = async (): Promise<void> => {
  let configuration;
  try {
    configuration = parseWebConfiguration(import.meta.env);
  } catch (error: unknown) {
    if (error instanceof ConfigurationError) {
      renderFailure({ status: "error", issues: error.issues });
      return;
    }
    throw error;
  }

  configureApiClient(configuration.apiBaseUrl);

  if (__VITE_CANVAS_TEST_API_ENABLED__ && configuration.testApiEnabled) {
    const { installCanvasTestApi } = await import(
      "./canvas-test-api/initializer.js"
    );
    installCanvasTestApi(configuration);
  }

  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/guest" element={<GuestPage />} />
            <Route path="/invite/:token" element={<InvitePage />} />
            <Route path="/rooms/:roomId" element={<RoomPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
};

void bootstrap().catch(() => {
  renderFailure({
    status: "error",
    issues: [{ path: "WEB_RUNTIME", code: "INVALID_FORMAT" }],
  });
});
