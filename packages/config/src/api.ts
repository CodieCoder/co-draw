import {
  readBoolean,
  readBucketName,
  readCredential,
  readHost,
  readOrigins,
  readPort,
  readPostgresUrl,
  readProfile,
  readReleaseId,
  readRequiredSecret,
  readS3Endpoint,
  readS3Region,
  readText,
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
  readonly databaseUrl: string;
  readonly collaborationUrl: string;
  readonly collaborationSigningSecret: string;
  readonly objectStorageEndpoint: string;
  readonly objectStorageRegion: string;
  readonly objectStorageBucket: string;
  readonly objectStorageAccessKey: string;
  readonly objectStorageSecretKey: string;
  readonly objectStorageForcePathStyle: boolean;
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
    databaseUrl: readPostgresUrl(raw, "API_DATABASE_URL", profile),
    collaborationUrl: readText(raw, "COLLABORATION_URL", profile, "ws://localhost:1234"),
    collaborationSigningSecret: readRequiredSecret(
      raw,
      "COLLABORATION_SIGNING_SECRET",
      profile,
      32,
    ),
    objectStorageEndpoint: readS3Endpoint(
      raw,
      "OBJECT_STORAGE_ENDPOINT",
      profile,
    ),
    objectStorageRegion: readS3Region(
      raw,
      "OBJECT_STORAGE_REGION",
      profile,
    ),
    objectStorageBucket: readBucketName(
      raw,
      "OBJECT_STORAGE_BUCKET",
      profile,
    ),
    objectStorageAccessKey: readCredential(
      raw,
      "OBJECT_STORAGE_ACCESS_KEY",
      profile,
    ),
    objectStorageSecretKey: readCredential(
      raw,
      "OBJECT_STORAGE_SECRET_KEY",
      profile,
    ),
    objectStorageForcePathStyle: readBoolean(
      raw,
      "OBJECT_STORAGE_FORCE_PATH_STYLE",
      profile,
      true,
    ),
  };
};
