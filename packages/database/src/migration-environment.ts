type RawEnvironment = Readonly<Record<string, string | undefined>>;

interface DatabaseTarget {
  readonly databaseUrl: string;
  readonly role: string;
  readonly hostname: string;
  readonly port: string;
  readonly database: string;
}

export interface MigrationEnvironment {
  readonly databaseUrl: string;
  readonly apiRuntimeRole: string;
  readonly collaborationRuntimeRole: string;
}

const invalid = (field: string): never => {
  throw new Error(`Migration configuration ${field} is invalid.`);
};

const readTarget = (
  environment: RawEnvironment,
  field: string,
): DatabaseTarget => {
  const databaseUrl = environment[field]?.trim();
  if (!databaseUrl) {
    return invalid(field);
  }

  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    return invalid(field);
  }
  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    return invalid(field);
  }

  let role: string;
  let database: string;
  try {
    role = decodeURIComponent(url.username);
    database = decodeURIComponent(url.pathname.replace(/^\//u, ""));
  } catch {
    return invalid(field);
  }
  if (!role || !url.password || !url.hostname || !database) {
    return invalid(field);
  }

  return {
    databaseUrl,
    role,
    hostname: url.hostname,
    port: url.port || "5432",
    database,
  };
};

const assertSameTarget = (
  migration: DatabaseTarget,
  runtime: DatabaseTarget,
  field: string,
): void => {
  if (
    migration.hostname !== runtime.hostname ||
    migration.port !== runtime.port ||
    migration.database !== runtime.database
  ) {
    invalid(field);
  }
};

export const parseMigrationEnvironment = (
  environment: RawEnvironment,
): MigrationEnvironment => {
  const migration = readTarget(environment, "MIGRATION_DATABASE_URL");
  const api = readTarget(environment, "API_DATABASE_URL");
  const collaboration = readTarget(
    environment,
    "COLLABORATION_DATABASE_URL",
  );

  assertSameTarget(migration, api, "API_DATABASE_URL");
  assertSameTarget(migration, collaboration, "COLLABORATION_DATABASE_URL");
  if (new Set([migration.role, api.role, collaboration.role]).size !== 3) {
    return invalid("database roles");
  }

  return {
    databaseUrl: migration.databaseUrl,
    apiRuntimeRole: api.role,
    collaborationRuntimeRole: collaboration.role,
  };
};
