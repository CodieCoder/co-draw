import {
  ConfigurationError,
  readHost,
  readOrigins,
  readPort,
  readPostgresUrl,
  readProfile,
  readReleaseId,
  readRequiredSecret,
  readText,
  type ApplicationProfile,
  type RawEnvironment,
} from "./common.js";

export { ConfigurationError, type ConfigurationIssue } from "./common.js";

export interface CollaborationConfiguration {
  readonly profile: ApplicationProfile;
  readonly host: string;
  readonly port: number;
  readonly allowedWebOrigins: readonly string[];
  readonly releaseId: string;
  readonly supportedExcalidrawVersion: "0.18.1";
  readonly databaseUrl: string;
  readonly collaborationSigningSecret: string;
}

export const parseCollaborationConfiguration = (
  raw: RawEnvironment,
): CollaborationConfiguration => {
  const profile = readProfile(raw, "APP_PROFILE");
  const supportedExcalidrawVersion = readText(
    raw,
    "SUPPORTED_EXCALIDRAW_VERSION",
    profile,
    "0.18.1",
  );

  if (supportedExcalidrawVersion !== "0.18.1") {
    throw new ConfigurationError([
      {
        path: "SUPPORTED_EXCALIDRAW_VERSION",
        code: "INVALID_FORMAT",
      },
    ]);
  }

  return {
    profile,
    host: readHost(raw, "COLLABORATION_HOST", profile),
    port: readPort(raw, "COLLABORATION_PORT", profile, 1_234),
    allowedWebOrigins: readOrigins(raw, "ALLOWED_WEB_ORIGINS", profile),
    releaseId: readReleaseId(raw, "RELEASE_ID", profile),
    supportedExcalidrawVersion,
    databaseUrl: readPostgresUrl(raw, "COLLABORATION_DATABASE_URL", profile),
    collaborationSigningSecret: readRequiredSecret(
      raw,
      "COLLABORATION_SIGNING_SECRET",
      profile,
      32,
    ),
  };
};
