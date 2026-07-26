-- =============================================================================
-- Migration 002 — API Runtime Privileges
-- =============================================================================
-- Runtime role names are supplied by the migration runner through PostgreSQL
-- session settings. The migration identity remains the only DDL owner.
-- =============================================================================

DO $grants$
DECLARE
  api_role text := current_setting('vega.api_runtime_role');
BEGIN
  EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', api_role);
  EXECUTE format('REVOKE CREATE ON SCHEMA public FROM %I', api_role);
  EXECUTE format('GRANT USAGE ON SCHEMA public TO %I', api_role);
  EXECUTE format('GRANT SELECT ON TABLE public.pgmigrations TO %I', api_role);
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
    'GRANT TEMP ON DATABASE %I TO %I',
    current_database(),
    api_role
  );
END
$grants$;
