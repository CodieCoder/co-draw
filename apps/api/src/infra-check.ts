import { randomUUID } from "node:crypto";

import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { parseApiConfiguration } from "@vega/config/api";
import { parseCollaborationConfiguration } from "@vega/config/collaboration";
import {
  SUPPORTED_MIGRATIONS,
  createPool,
  endPool,
  probeDatabaseReadiness,
} from "@vega/database";

import {
  createStorageClient,
  probeStorageReadiness,
} from "./storage-readiness.js";

const REQUIRED_TABLES = [
  "assets",
  "audit_events",
  "collaboration_documents",
  "guest_sessions",
  "guests",
  "room_memberships",
  "room_share_links",
  "rooms",
] as const;

const REQUIRED_INDEXES = [
  "idx_assets_cleanup_candidates",
  "idx_assets_created_by",
  "idx_assets_room_status",
  "idx_assets_storage_key",
  "idx_audit_events_actor_created",
  "idx_audit_events_room_created",
  "idx_audit_events_type_created",
  "idx_guest_sessions_expires_at",
  "idx_guest_sessions_guest_id",
  "idx_guest_sessions_token_hash",
  "idx_guests_email_normalized",
  "idx_guests_last_seen_at",
  "idx_room_memberships_guest_active",
  "idx_room_memberships_room_guest",
  "idx_room_memberships_room_role_active",
  "idx_room_share_links_room_active",
  "idx_room_share_links_token_hash",
  "idx_rooms_created_by",
  "idx_rooms_status_updated",
] as const;

class InfraCheckFailure extends Error {}

const requireCondition: (
  condition: unknown,
  code: string,
) => asserts condition = (condition, code) => {
  if (!condition) {
    throw new InfraCheckFailure(code);
  }
};

const databaseRole = (databaseUrl: string): string => {
  try {
    return decodeURIComponent(new URL(databaseUrl).username);
  } catch {
    throw new InfraCheckFailure("DATABASE_ROLE_INVALID");
  }
};

const proveDdlDenied = async (
  pool: ReturnType<typeof createPool>,
): Promise<void> => {
  let createSucceeded = false;
  let rollbackFailed = false;
  try {
    await pool.query("BEGIN");
    await pool.query(
      `CREATE TABLE public.vega_runtime_ddl_probe (id integer)`,
    );
    createSucceeded = true;
  } catch (error: unknown) {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";
    requireCondition(code === "42501", "RUNTIME_DDL_FAILURE_UNEXPECTED");
  } finally {
    try {
      await pool.query("ROLLBACK");
    } catch {
      rollbackFailed = true;
    }
  }
  requireCondition(!rollbackFailed, "RUNTIME_DDL_ROLLBACK_FAILED");
  requireCondition(!createSucceeded, "RUNTIME_DDL_ALLOWED");
};

const checkDatabase = async (): Promise<void> => {
  const apiConfiguration = parseApiConfiguration(process.env);
  const collaborationConfiguration =
    parseCollaborationConfiguration(process.env);
  const apiPool = createPool(apiConfiguration.databaseUrl);
  const collaborationPool = createPool(collaborationConfiguration.databaseUrl);

  try {
    const [apiReadiness, collaborationReadiness] = await Promise.all([
      probeDatabaseReadiness(apiPool),
      probeDatabaseReadiness(collaborationPool),
    ]);
    requireCondition(apiReadiness.ready, "API_DATABASE_NOT_READY");
    requireCondition(
      collaborationReadiness.ready,
      "COLLABORATION_DATABASE_NOT_READY",
    );

    const migrations = await apiPool.query<{ name: string }>(
      `SELECT name FROM public.pgmigrations ORDER BY id ASC`,
    );
    requireCondition(
      JSON.stringify(migrations.rows.map(({ name }) => name)) ===
        JSON.stringify(SUPPORTED_MIGRATIONS),
      "MIGRATION_SET_UNSUPPORTED",
    );

    const tableResult = await apiPool.query<{ table_name: string }>(
      `SELECT class.relname AS table_name
         FROM pg_catalog.pg_class AS class
         JOIN pg_catalog.pg_namespace AS namespace
           ON namespace.oid = class.relnamespace
        WHERE namespace.nspname = 'public'
          AND class.relkind = 'r'
          AND class.relname <> 'pgmigrations'
        ORDER BY class.relname`,
    );
    requireCondition(
      JSON.stringify(tableResult.rows.map(({ table_name }) => table_name)) ===
        JSON.stringify(REQUIRED_TABLES),
      "TABLE_SET_UNSUPPORTED",
    );

    const indexResult = await apiPool.query<{ indexname: string }>(
      `SELECT indexname
         FROM pg_catalog.pg_indexes
        WHERE schemaname = 'public'
          AND indexname = ANY ($1::text[])`,
      [REQUIRED_INDEXES],
    );
    const indexes = new Set(indexResult.rows.map(({ indexname }) => indexname));
    requireCondition(
      REQUIRED_INDEXES.every((index) => indexes.has(index)),
      "REQUIRED_INDEX_MISSING",
    );

    const constraintResult = await apiPool.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT 1
           FROM pg_catalog.pg_constraint
          WHERE conname =
            'collaboration_documents_snapshot_sequence_nonnegative'
            AND convalidated
       ) AS exists`,
    );
    requireCondition(
      constraintResult.rows[0]?.exists,
      "SNAPSHOT_SEQUENCE_CONSTRAINT_MISSING",
    );

    const apiRole = databaseRole(apiConfiguration.databaseUrl);
    const collaborationRole = databaseRole(
      collaborationConfiguration.databaseUrl,
    );
    const privilegeResult = await apiPool.query<{
      api_collaboration_documents: boolean;
      api_schema_create: boolean;
      collaboration_assets: boolean;
      collaboration_audit: boolean;
      collaboration_document_delete: boolean;
      collaboration_document_insert: boolean;
      collaboration_document_select: boolean;
      collaboration_document_update: boolean;
      collaboration_email: boolean;
      collaboration_guest_username: boolean;
      collaboration_schema_create: boolean;
      collaboration_share_links: boolean;
    }>(
      `SELECT
         has_schema_privilege($1, 'public', 'CREATE')
           AS api_schema_create,
         has_table_privilege(
           $1,
           'public.collaboration_documents',
           'SELECT'
         ) AS api_collaboration_documents,
         has_schema_privilege($2, 'public', 'CREATE')
           AS collaboration_schema_create,
         has_column_privilege(
           $2,
           'public.guests',
           'username',
           'SELECT'
         ) AS collaboration_guest_username,
         has_column_privilege(
           $2,
           'public.guests',
           'email_normalized',
           'SELECT'
         ) AS collaboration_email,
         has_table_privilege($2, 'public.assets', 'SELECT')
           AS collaboration_assets,
         has_table_privilege($2, 'public.audit_events', 'SELECT')
           AS collaboration_audit,
         has_table_privilege($2, 'public.room_share_links', 'SELECT')
           AS collaboration_share_links,
         has_table_privilege(
           $2,
           'public.collaboration_documents',
           'SELECT'
         ) AS collaboration_document_select,
         has_table_privilege(
           $2,
           'public.collaboration_documents',
           'INSERT'
         ) AS collaboration_document_insert,
         has_table_privilege(
           $2,
           'public.collaboration_documents',
           'UPDATE'
         ) AS collaboration_document_update,
         has_table_privilege(
           $2,
           'public.collaboration_documents',
           'DELETE'
         ) AS collaboration_document_delete`,
      [apiRole, collaborationRole],
    );
    const privileges = privilegeResult.rows[0];
    requireCondition(
      privileges &&
        !privileges.api_schema_create &&
        !privileges.api_collaboration_documents &&
        !privileges.collaboration_schema_create &&
        privileges.collaboration_guest_username &&
        !privileges.collaboration_email &&
        !privileges.collaboration_assets &&
        !privileges.collaboration_audit &&
        !privileges.collaboration_share_links &&
        privileges.collaboration_document_select &&
        privileges.collaboration_document_insert &&
        privileges.collaboration_document_update &&
        privileges.collaboration_document_delete,
      "RUNTIME_PRIVILEGES_UNSUPPORTED",
    );

    await Promise.all([
      proveDdlDenied(apiPool),
      proveDdlDenied(collaborationPool),
    ]);
    process.stdout.write(
      `Database: ready (${SUPPORTED_MIGRATIONS.length} migrations, 8 tables, scoped runtime privileges).\n`,
    );
  } finally {
    await Promise.all([endPool(apiPool), endPool(collaborationPool)]);
  }
};

const assertAnonymousDenied = async (
  endpoint: string,
  bucket: string,
  key: string,
): Promise<void> => {
  const baseUrl = endpoint.replace(/\/$/u, "");
  const listUrl = new URL(`${baseUrl}/${encodeURIComponent(bucket)}`);
  listUrl.searchParams.set("list-type", "2");
  const objectPath = key.split("/").map(encodeURIComponent).join("/");
  const [listResponse, objectResponse] = await Promise.all([
    fetch(listUrl, { signal: AbortSignal.timeout(5_000) }),
    fetch(`${baseUrl}/${encodeURIComponent(bucket)}/${objectPath}`, {
      signal: AbortSignal.timeout(5_000),
    }),
  ]);
  requireCondition(
    [401, 403].includes(listResponse.status),
    "ANONYMOUS_LIST_ALLOWED",
  );
  requireCondition(
    [401, 403].includes(objectResponse.status),
    "ANONYMOUS_READ_ALLOWED",
  );
};

const checkStorage = async (): Promise<void> => {
  const configuration = parseApiConfiguration(process.env);
  const client = createStorageClient({
    endpoint: configuration.objectStorageEndpoint,
    region: configuration.objectStorageRegion,
    accessKey: configuration.objectStorageAccessKey,
    secretKey: configuration.objectStorageSecretKey,
    forcePathStyle: configuration.objectStorageForcePathStyle,
  });
  const privacyKey = `.health/privacy-${randomUUID()}.txt`;
  let privacyObjectMayExist = false;

  try {
    try {
      const readiness = await probeStorageReadiness(
        client,
        configuration.objectStorageBucket,
      );
      requireCondition(readiness.ready, "OBJECT_STORAGE_NOT_READY");

      privacyObjectMayExist = true;
      await client.send(
        new PutObjectCommand({
          Bucket: configuration.objectStorageBucket,
          Key: privacyKey,
          Body: "privacy-probe",
          ContentType: "text/plain",
        }),
      );
      await assertAnonymousDenied(
        configuration.objectStorageEndpoint,
        configuration.objectStorageBucket,
        privacyKey,
      );
    } finally {
      if (privacyObjectMayExist) {
        await client.send(
          new DeleteObjectCommand({
            Bucket: configuration.objectStorageBucket,
            Key: privacyKey,
          }),
        );
      }
    }

    const residual = await client.send(
      new ListObjectsV2Command({
        Bucket: configuration.objectStorageBucket,
        Prefix: ".health/",
      }),
    );
    requireCondition(
      (residual.Contents?.length ?? 0) === 0,
      "RESIDUAL_STORAGE_PROBE_FOUND",
    );
    process.stdout.write(
      "Object storage: ready (private create/read/delete and cleanup verified).\n",
    );
  } finally {
    client.destroy();
  }
};

const run = async (): Promise<void> => {
  await checkDatabase();
  await checkStorage();
  process.stdout.write("infra:check: all checks passed.\n");
};

void run().catch((error: unknown) => {
  const code =
    error instanceof InfraCheckFailure ? error.message : "INFRA_CHECK_FAILED";
  process.stderr.write(`infra:check: ${code}\n`);
  process.exitCode = 1;
});
