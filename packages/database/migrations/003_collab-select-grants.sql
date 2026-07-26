-- =============================================================================
-- Migration 003 — Collaboration Runtime Privileges
-- =============================================================================
-- Authority reads are column-scoped so guest email and unrelated API-owned
-- data cannot cross into the collaboration runtime.
-- =============================================================================

DO $grants$
DECLARE
  collaboration_role text := current_setting('vega.collaboration_runtime_role');
BEGIN
  EXECUTE format(
    'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I',
    collaboration_role
  );
  EXECUTE format(
    'REVOKE CREATE ON SCHEMA public FROM %I',
    collaboration_role
  );
  EXECUTE format(
    'GRANT USAGE ON SCHEMA public TO %I',
    collaboration_role
  );
  EXECUTE format(
    'GRANT SELECT ON TABLE public.pgmigrations TO %I',
    collaboration_role
  );
  EXECUTE format(
    'GRANT SELECT (
       id,
       username,
       colour,
       disabled_at
     ) ON TABLE public.guests TO %I',
    collaboration_role
  );
  EXECUTE format(
    'GRANT SELECT (
       id,
       guest_id,
       token_hash,
       expires_at,
       revoked_at
     ) ON TABLE public.guest_sessions TO %I',
    collaboration_role
  );
  EXECUTE format(
    'GRANT SELECT (
       id,
       status,
       collaboration_schema_version,
       excalidraw_version,
       archived_at
     ) ON TABLE public.rooms TO %I',
    collaboration_role
  );
  EXECUTE format(
    'GRANT SELECT (
       room_id,
       guest_id,
       role,
       revoked_at
     ) ON TABLE public.room_memberships TO %I',
    collaboration_role
  );
  EXECUTE format(
    'GRANT SELECT, INSERT, UPDATE, DELETE
       ON TABLE public.collaboration_documents TO %I',
    collaboration_role
  );
  EXECUTE format(
    'GRANT TEMP ON DATABASE %I TO %I',
    current_database(),
    collaboration_role
  );
END
$grants$;
