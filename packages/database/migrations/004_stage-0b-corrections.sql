-- =============================================================================
-- Migration 004 — Stage 0B Forward Corrections
-- =============================================================================
-- Existing local volumes may already contain the original broad grants and
-- unconstrained snapshot sequence. Reconcile them without resetting data.
-- =============================================================================

DO $constraint$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_catalog.pg_constraint
     WHERE conname =
       'collaboration_documents_snapshot_sequence_nonnegative'
       AND conrelid = 'public.collaboration_documents'::regclass
  ) THEN
    ALTER TABLE public.collaboration_documents
      ADD CONSTRAINT collaboration_documents_snapshot_sequence_nonnegative
      CHECK (snapshot_sequence >= 0);
  END IF;
END
$constraint$;

DO $grants$
DECLARE
  api_role text := current_setting('vega.api_runtime_role');
  collaboration_role text := current_setting('vega.collaboration_runtime_role');
BEGIN
  EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', api_role);
  EXECUTE format(
    'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I',
    collaboration_role
  );
  EXECUTE format('REVOKE CREATE ON SCHEMA public FROM %I', api_role);
  EXECUTE format(
    'REVOKE CREATE ON SCHEMA public FROM %I',
    collaboration_role
  );

  EXECUTE format('GRANT USAGE ON SCHEMA public TO %I', api_role);
  EXECUTE format(
    'GRANT USAGE ON SCHEMA public TO %I',
    collaboration_role
  );
  EXECUTE format('GRANT SELECT ON TABLE public.pgmigrations TO %I', api_role);
  EXECUTE format(
    'GRANT SELECT ON TABLE public.pgmigrations TO %I',
    collaboration_role
  );

  EXECUTE format(
    'GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
       public.guests,
       public.guest_sessions,
       public.rooms,
       public.room_memberships,
       public.room_share_links,
       public.assets,
       public.audit_events
     TO %I',
    api_role
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
    api_role
  );
  EXECUTE format(
    'GRANT TEMP ON DATABASE %I TO %I',
    current_database(),
    collaboration_role
  );
END
$grants$;
