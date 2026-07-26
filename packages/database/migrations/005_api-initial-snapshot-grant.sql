-- =============================================================================
-- Migration 005 — API initial collaboration snapshot privilege
-- =============================================================================
-- Room creation atomically inserts the room, owner membership, and initial
-- empty Yjs snapshot. The API receives INSERT only; the collaboration runtime
-- remains the sole reader and updater of live collaboration documents.
-- =============================================================================

DO $grants$
DECLARE
  api_role text := current_setting('vega.api_runtime_role');
BEGIN
  EXECUTE format(
    'GRANT INSERT ON TABLE public.collaboration_documents TO %I',
    api_role
  );
END
$grants$;
