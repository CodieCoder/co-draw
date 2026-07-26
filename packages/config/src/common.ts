import { z } from "zod";

export type RawEnvironment = Readonly<Record<string, string | undefined>>;
export type ApplicationProfile = "local" | "demo" | "production";

export type ConfigurationIssueCode =
  | "INVALID_FORMAT"
  | "INVALID_ORIGIN"
  | "INVALID_PORT"
  | "INVALID_PROTOCOL"
  | "MISSING_REQUIRED"
  | "WILDCARD_ORIGIN_FORBIDDEN";

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
