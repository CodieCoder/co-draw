import {
  ConfigurationError,
  readBoolean,
  readProfile,
  readReleaseId,
  readUrl,
  type ApplicationProfile,
  type RawEnvironment,
} from "./common.js";

export {
  ConfigurationError,
  type ApplicationProfile,
  type ConfigurationIssue,
} from "./common.js";

export interface WebConfiguration {
  readonly profile: ApplicationProfile;
  readonly apiBaseUrl: string;
  readonly collaborationUrl: string;
  readonly releaseId: string;
  readonly testApiEnabled: boolean;
}

export const parseWebConfiguration = (
  raw: RawEnvironment,
): WebConfiguration => {
  const profile = readProfile(raw, "VITE_APP_PROFILE");

  const testApiEnabled = readBoolean(
    raw,
    "VITE_CANVAS_TEST_API_ENABLED",
    profile,
    false,
  );

  if (testApiEnabled && profile === "production") {
    throw new ConfigurationError([
      { path: "VITE_CANVAS_TEST_API_ENABLED", code: "INCOMPATIBLE_PROFILE" },
    ]);
  }

  return {
    profile,
    apiBaseUrl: readUrl(
      raw,
      "VITE_API_BASE_URL",
      profile,
      "http://localhost:4000",
      ["http:", "https:"],
      "https:",
    ),
    collaborationUrl: readUrl(
      raw,
      "VITE_COLLABORATION_URL",
      profile,
      "ws://localhost:1234",
      ["ws:", "wss:"],
      "wss:",
    ),
    releaseId: readReleaseId(raw, "VITE_RELEASE_ID", profile),
    testApiEnabled,
  };
};
