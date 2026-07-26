import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { App } from "./App.js";

describe("foundation status shell", () => {
  it("renders the valid public-configuration state", () => {
    const output = renderToStaticMarkup(
      <App
        state={{
          status: "ready",
          configuration: {
            profile: "local",
            apiBaseUrl: "http://localhost:4000",
            collaborationUrl: "ws://localhost:1234",
            releaseId: "test-release",
            testApiEnabled: false,
          },
        }}
      />,
    );

    expect(output).toContain("Public configuration is valid");
    expect(output).toContain("test-release");
    expect(output).toContain("No room or scene is created");
  });

  it("renders a bounded, redacted configuration failure", () => {
    const output = renderToStaticMarkup(
      <App
        state={{
          status: "error",
          issues: [
            {
              path: "VITE_API_BASE_URL",
              code: "INVALID_PROTOCOL",
            },
          ],
        }}
      />,
    );

    expect(output).toContain('role="alert"');
    expect(output).toContain("This shell cannot start safely");
    expect(output).toContain("VITE_API_BASE_URL");
    expect(output).toContain("Rejected values are withheld");
  });
});
