import {
  readProfile,
  readReleaseId,
  readUrl,
  type ApplicationProfile,
  type RawEnvironment,
} from "./common.js";

export { ConfigurationError, type ConfigurationIssue } from "./common.js";

export interface WebConfiguration {
  readonly profile: ApplicationProfile;
  readonly apiBaseUrl: string;
  readonly collaborationUrl: string;
  readonly releaseId: string;
}

export const parseWebConfiguration = (
  raw: RawEnvironment,
): WebConfiguration => {
  const profile = readProfile(raw, "VITE_APP_PROFILE");

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
  };
};
