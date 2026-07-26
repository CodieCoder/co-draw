import {
  readHost,
  readOrigins,
  readPort,
  readProfile,
  readReleaseId,
  type ApplicationProfile,
  type RawEnvironment,
} from "./common.js";

export { ConfigurationError, type ConfigurationIssue } from "./common.js";

export interface ApiConfiguration {
  readonly profile: ApplicationProfile;
  readonly host: string;
  readonly port: number;
  readonly allowedWebOrigins: readonly string[];
  readonly releaseId: string;
}

export const parseApiConfiguration = (
  raw: RawEnvironment,
): ApiConfiguration => {
  const profile = readProfile(raw, "APP_PROFILE");

  return {
    profile,
    host: readHost(raw, "API_HOST", profile),
    port: readPort(raw, "API_PORT", profile, 4_000),
    allowedWebOrigins: readOrigins(raw, "ALLOWED_WEB_ORIGINS", profile),
    releaseId: readReleaseId(raw, "RELEASE_ID", profile),
  };
};
