import { z } from "zod";

export type RawEnvironment = Readonly<Record<string, string | undefined>>;
export type ApplicationProfile = "local" | "demo" | "production";

export type ConfigurationIssueCode =
  | "INCOMPATIBLE_PROFILE"
  | "INVALID_FORMAT"
  | "INVALID_ORIGIN"
  | "INVALID_PORT"
  | "INVALID_PROTOCOL"
  | "MISSING_REQUIRED"
  | "WILDCARD_ORIGIN_FORBIDDEN"
  | "PLACEHOLDER_DETECTED"
  | "INVALID_BUCKET_NAME"
  | "INVALID_REGION"
  | "TLS_REQUIRED";

export interface ConfigurationIssue {
  readonly path: string;
  readonly code: ConfigurationIssueCode;
}

export class ConfigurationError extends Error {
  public readonly code = "CONFIGURATION_INVALID";
  public readonly issues: readonly ConfigurationIssue[];

  public constructor(issues: readonly ConfigurationIssue[]) {
    super("Configuration is invalid. Inspect the redacted issue paths and codes.");
    this.name = "ConfigurationError";
    this.issues = issues;
  }
}

const profileSchema = z.enum(["local", "demo", "production"]);
const hostSchema = z.string().min(1).max(255).regex(/^[A-Za-z0-9.:[\]_-]+$/u);
const releaseIdSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9._-]+$/u);

const fail = (
  path: string,
  code: ConfigurationIssueCode,
): never => {
  throw new ConfigurationError([{ path, code }]);
};

export const readProfile = (
  raw: RawEnvironment,
  field: "APP_PROFILE" | "VITE_APP_PROFILE",
): ApplicationProfile => {
  const result = profileSchema.safeParse(raw[field] ?? "local");
  return result.success ? result.data : fail(field, "INVALID_FORMAT");
};

export const readText = (
  raw: RawEnvironment,
  field: string,
  profile: ApplicationProfile,
  localDefault: string,
): string => {
  const value = raw[field];
  if (value === undefined || value.trim() === "") {
    return profile === "local" ? localDefault : fail(field, "MISSING_REQUIRED");
  }
  return value.trim();
};

export const readReleaseId = (
  raw: RawEnvironment,
  field: string,
  profile: ApplicationProfile,
): string => {
  const value = readText(raw, field, profile, "local-dev");
  const result = releaseIdSchema.safeParse(value);
  return result.success ? result.data : fail(field, "INVALID_FORMAT");
};

export const readHost = (
  raw: RawEnvironment,
  field: string,
  profile: ApplicationProfile,
): string => {
  const value = readText(raw, field, profile, "127.0.0.1");
  const result = hostSchema.safeParse(value);
  return result.success ? result.data : fail(field, "INVALID_FORMAT");
};

export const readPort = (
  raw: RawEnvironment,
  field: string,
  profile: ApplicationProfile,
  localDefault: number,
): number => {
  const rawValue = readText(raw, field, profile, String(localDefault));
  if (!/^\d{1,5}$/u.test(rawValue)) {
    return fail(field, "INVALID_PORT");
  }

  const value = Number(rawValue);
  return Number.isInteger(value) && value >= 1 && value <= 65_535
    ? value
    : fail(field, "INVALID_PORT");
};

export const readUrl = (
  raw: RawEnvironment,
  field: string,
  profile: ApplicationProfile,
  localDefault: string,
  localProtocols: readonly string[],
  secureProtocol: string,
): string => {
  const value = readText(raw, field, profile, localDefault);

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return fail(field, "INVALID_FORMAT");
  }

  const permittedProtocols =
    profile === "local" ? localProtocols : [secureProtocol];
  if (!permittedProtocols.includes(parsed.protocol)) {
    return fail(field, "INVALID_PROTOCOL");
  }

  if (parsed.username !== "" || parsed.password !== "") {
    return fail(field, "INVALID_FORMAT");
  }

  return parsed.toString().replace(/\/$/u, "");
};

// ---------------------------------------------------------------------------
// Placeholder detection
// ---------------------------------------------------------------------------

const PLACEHOLDER_PATTERN = /\b(CHANGE_ME|change_me|changeme)\b/u;
const BRACKET_PLACEHOLDER_PATTERN = /^<.*>$/u;
const PREFIX_PLACEHOLDER_PATTERN = /^your-/iu;

/**
 * Returns true when the value is a non-usable placeholder.
 * The caller must handle the failure (reject vs. warn vs. default).
 */
export const isPlaceholderValue = (value: string): boolean => {
  const trimmed = value.trim();
  return (
    trimmed === "" ||
    PLACEHOLDER_PATTERN.test(trimmed) ||
    BRACKET_PLACEHOLDER_PATTERN.test(trimmed) ||
    PREFIX_PLACEHOLDER_PATTERN.test(trimmed)
  );
};

// ---------------------------------------------------------------------------
// Specialized validators
// ---------------------------------------------------------------------------

/**
 * Validate a single credential field (access key, secret key, password).
 * Rejects CHANGE_ME and other placeholder patterns. Accepts any non-empty,
 * non-placeholder string.
 */
export const readCredential = (
  raw: RawEnvironment,
  field: string,
  _profile: ApplicationProfile,
): string => {
  const value = raw[field];
  if (value === undefined || value.trim() === "") {
    return fail(field, "MISSING_REQUIRED");
  }
  if (isPlaceholderValue(value)) {
    return fail(field, "PLACEHOLDER_DETECTED");
  }
  return value.trim();
};

/**
 * Validate a PostgreSQL connection URL.
 *
 * Rules:
 * - Must be a valid URL with postgresql:// (or postgres://) protocol.
 * - Must include username and password (non-empty, non-placeholder).
 * - Must include a hostname.
 * - For non-local profiles, the connection must use TLS:
 *   either sslmode=require (or stricter) in the query string, or
 *   a hostname that is not localhost/127.0.0.1 with sslmode not set to
 *   disable.
 * - Rejects CHANGE_ME placeholders anywhere in the URL.
 */
export const readPostgresUrl = (
  raw: RawEnvironment,
  field: string,
  profile: ApplicationProfile,
): string => {
  const value = raw[field];
  if (value === undefined || value.trim() === "") {
    return fail(field, "MISSING_REQUIRED");
  }

  const trimmed = value.trim();

  if (isPlaceholderValue(trimmed)) {
    return fail(field, "PLACEHOLDER_DETECTED");
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return fail(field, "INVALID_FORMAT");
  }

  // Protocol must be postgresql: or postgres:
  if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
    return fail(field, "INVALID_PROTOCOL");
  }

  // Must have non-empty, non-placeholder username and password.
  const user = parsed.username;
  const pass = parsed.password;
  if (user === "" || pass === "" || isPlaceholderValue(user) || isPlaceholderValue(pass)) {
    return fail(field, "PLACEHOLDER_DETECTED");
  }

  // Hostname must be non-empty (already enforced by URL constructor, but guard defensively).
  if (parsed.hostname === "") {
    return fail(field, "INVALID_FORMAT");
  }
  if (
    parsed.pathname === "" ||
    parsed.pathname === "/" ||
    parsed.pathname.slice(1).includes("/") ||
    parsed.hash !== ""
  ) {
    return fail(field, "INVALID_FORMAT");
  }

  // Non-local profiles require TLS.
  if (profile !== "local") {
    const sslmode = parsed.searchParams.get("sslmode")?.toLowerCase();
    const isLocalhost =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "::1";

    // Require TLS unless it's a loopback address with explicit disable (not allowed in prod).
    if (isLocalhost) {
      return fail(field, "TLS_REQUIRED");
    }

    // With sslmode, require, verify-ca, or verify-full are acceptable.
    const tlsModes = ["require", "verify-ca", "verify-full"];
    if (!sslmode || !tlsModes.includes(sslmode)) {
      return fail(field, "TLS_REQUIRED");
    }
  }

  return trimmed;
};

/**
 * Validate an S3-compatible object-storage endpoint URL.
 *
 * Rules:
 * - Must be a valid URL with http:// or https:// protocol.
 * - For local profile: plain HTTP to loopback is allowed.
 * - For non-local profiles: HTTPS is required.
 * - Rejects CHANGE_ME placeholders.
 * - Rejects URLs with embedded credentials.
 */
export const readS3Endpoint = (
  raw: RawEnvironment,
  field: string,
  profile: ApplicationProfile,
): string => {
  const value = raw[field];
  if (value === undefined || value.trim() === "") {
    return fail(field, "MISSING_REQUIRED");
  }

  const trimmed = value.trim();

  if (isPlaceholderValue(trimmed)) {
    return fail(field, "PLACEHOLDER_DETECTED");
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return fail(field, "INVALID_FORMAT");
  }

  // Must be HTTP or HTTPS.
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return fail(field, "INVALID_PROTOCOL");
  }

  // Reject URLs with embedded credentials.
  if (parsed.username !== "" || parsed.password !== "") {
    return fail(field, "INVALID_FORMAT");
  }
  if (parsed.pathname !== "/" || parsed.search !== "" || parsed.hash !== "") {
    return fail(field, "INVALID_FORMAT");
  }

  // For non-local profiles, HTTPS is required.
  if (profile !== "local" && parsed.protocol !== "https:") {
    return fail(field, "TLS_REQUIRED");
  }

  // For local profile, plain HTTP is only allowed on loopback addresses.
  if (profile === "local" && parsed.protocol === "http:") {
    const isLoopback =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "[::1]" ||
      parsed.hostname === "::1";
    if (!isLoopback) {
      return fail(field, "TLS_REQUIRED");
    }
  }

  return trimmed.replace(/\/$/u, "");
};

/**
 * Validate an S3 bucket name.
 *
 * Rules:
 * - Must be 3-63 characters.
 * - Must consist of lowercase letters, digits, hyphens, and periods.
 * - Must not begin or end with a hyphen.
 * - Must not be formatted as an IP address.
 * - Rejects CHANGE_ME placeholders.
 */
const BUCKET_NAME_PATTERN = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/u;
const IP_ADDRESS_PATTERN = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/u;

export const readBucketName = (
  raw: RawEnvironment,
  field: string,
  _profile: ApplicationProfile,
): string => {
  const value = raw[field];
  if (value === undefined || value.trim() === "") {
    return fail(field, "MISSING_REQUIRED");
  }

  const trimmed = value.trim();

  if (isPlaceholderValue(trimmed)) {
    return fail(field, "PLACEHOLDER_DETECTED");
  }

  if (trimmed.length < 3 || trimmed.length > 63) {
    return fail(field, "INVALID_BUCKET_NAME");
  }

  if (!BUCKET_NAME_PATTERN.test(trimmed)) {
    return fail(field, "INVALID_BUCKET_NAME");
  }

  if (IP_ADDRESS_PATTERN.test(trimmed)) {
    return fail(field, "INVALID_BUCKET_NAME");
  }
  if (
    trimmed.includes("..") ||
    trimmed.includes(".-") ||
    trimmed.includes("-.") ||
    trimmed.startsWith("xn--") ||
    /-s3alias$|--ol-s3$|\.mrap$|--x-s3$|--table-s3$/u.test(trimmed)
  ) {
    return fail(field, "INVALID_BUCKET_NAME");
  }

  return trimmed;
};

const REGION_PATTERN = /^[a-z0-9][a-z0-9-]{0,62}$/u;

export const readS3Region = (
  raw: RawEnvironment,
  field: string,
  profile: ApplicationProfile,
): string => {
  const value = readText(raw, field, profile, "us-east-1");
  return REGION_PATTERN.test(value) ? value : fail(field, "INVALID_REGION");
};

export const readRequiredSecret = (
  raw: RawEnvironment,
  field: string,
  _profile: ApplicationProfile,
): string => {
  const value = raw[field];
  if (value === undefined || value.trim() === "") {
    return fail(field, "MISSING_REQUIRED");
  }
  if (isPlaceholderValue(value)) {
    return fail(field, "PLACEHOLDER_DETECTED");
  }
  return value.trim();
};

export const readBoolean = (
  raw: RawEnvironment,
  field: string,
  profile: ApplicationProfile,
  localDefault: boolean,
): boolean => {
  const rawValue = raw[field];
  if (rawValue === undefined || rawValue.trim() === "") {
    if (profile === "local") {
      return localDefault;
    }
    return fail(field, "MISSING_REQUIRED");
  }
  const lowered = rawValue.trim().toLowerCase();
  if (lowered === "true" || lowered === "1") {
    return true;
  }
  if (lowered === "false" || lowered === "0") {
    return false;
  }
  return fail(field, "INVALID_FORMAT");
};

export const readOrigins = (
  raw: RawEnvironment,
  field: string,
  profile: ApplicationProfile,
): readonly string[] => {
  const input = readText(raw, field, profile, "http://localhost:5173");
  const candidates = input
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value !== "");

  if (candidates.length === 0) {
    return fail(field, "MISSING_REQUIRED");
  }

  if (candidates.includes("*")) {
    return fail(field, "WILDCARD_ORIGIN_FORBIDDEN");
  }

  return candidates.map((candidate) => {
    let url: URL;
    try {
      url = new URL(candidate);
    } catch {
      return fail(field, "INVALID_ORIGIN");
    }

    if (
      url.username !== "" ||
      url.password !== "" ||
      url.pathname !== "/" ||
      url.search !== "" ||
      url.hash !== ""
    ) {
      return fail(field, "INVALID_ORIGIN");
    }

    if (
      (profile === "local" &&
        url.protocol !== "http:" &&
        url.protocol !== "https:") ||
      (profile !== "local" && url.protocol !== "https:")
    ) {
      return fail(field, "INVALID_PROTOCOL");
    }

    return url.origin;
  });
};
