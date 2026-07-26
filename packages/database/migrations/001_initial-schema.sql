-- =============================================================================
-- Migration 001 — Initial MVP Schema
-- =============================================================================
-- Creates the eight mandatory MVP tables with accepted constraints, foreign
-- keys, checks, and indexes. No optional tables, seed data, or product rows.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Guests
-- ---------------------------------------------------------------------------
CREATE TABLE guests (
  id               UUID PRIMARY KEY,
  email_normalized TEXT NOT NULL,
  username         TEXT NOT NULL,
  colour           TEXT NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at     TIMESTAMPTZ,
  disabled_at      TIMESTAMPTZ
);

CREATE INDEX idx_guests_last_seen_at
  ON guests (last_seen_at);

CREATE INDEX idx_guests_email_normalized
  ON guests (email_normalized);

-- ---------------------------------------------------------------------------
-- 2. Guest Sessions
-- ---------------------------------------------------------------------------
CREATE TABLE guest_sessions (
  id                 UUID PRIMARY KEY,
  guest_id           UUID NOT NULL REFERENCES guests (id),
  token_hash         TEXT NOT NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at       TIMESTAMPTZ,
  expires_at         TIMESTAMPTZ NOT NULL,
  revoked_at         TIMESTAMPTZ,
  user_agent_summary TEXT,
  ip_hash            TEXT
);

CREATE UNIQUE INDEX idx_guest_sessions_token_hash
  ON guest_sessions (token_hash);

CREATE INDEX idx_guest_sessions_guest_id
  ON guest_sessions (guest_id);

CREATE INDEX idx_guest_sessions_expires_at
  ON guest_sessions (expires_at);

-- ---------------------------------------------------------------------------
-- 3. Rooms
-- ---------------------------------------------------------------------------
CREATE TABLE rooms (
  id                           UUID PRIMARY KEY,
  name                         TEXT NOT NULL,
  status                       TEXT NOT NULL DEFAULT 'active',
  created_by_guest_id          UUID NOT NULL REFERENCES guests (id),
  collaboration_schema_version INTEGER NOT NULL DEFAULT 1,
  excalidraw_version           TEXT NOT NULL,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at                  TIMESTAMPTZ,
  archived_by_guest_id         UUID REFERENCES guests (id),

  CHECK (status IN ('active', 'archived'))
);

CREATE INDEX idx_rooms_created_by
  ON rooms (created_by_guest_id);

CREATE INDEX idx_rooms_status_updated
  ON rooms (status, updated_at DESC);

-- ---------------------------------------------------------------------------
-- 4. Room Memberships
-- ---------------------------------------------------------------------------
CREATE TABLE room_memberships (
  id                  UUID PRIMARY KEY,
  room_id             UUID NOT NULL REFERENCES rooms (id),
  guest_id            UUID NOT NULL REFERENCES guests (id),
  role                TEXT NOT NULL,
  created_by_guest_id UUID REFERENCES guests (id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at          TIMESTAMPTZ,
  revoked_by_guest_id UUID REFERENCES guests (id),

  UNIQUE (room_id, guest_id),
  CHECK (role IN ('owner', 'editor', 'viewer'))
);

CREATE UNIQUE INDEX idx_room_memberships_room_guest
  ON room_memberships (room_id, guest_id);

CREATE INDEX idx_room_memberships_guest_active
  ON room_memberships (guest_id, room_id)
  WHERE revoked_at IS NULL;

CREATE INDEX idx_room_memberships_room_role_active
  ON room_memberships (room_id, role)
  WHERE revoked_at IS NULL;

-- ---------------------------------------------------------------------------
-- 5. Room Share Links
-- ---------------------------------------------------------------------------
CREATE TABLE room_share_links (
  id                  UUID PRIMARY KEY,
  room_id             UUID NOT NULL REFERENCES rooms (id),
  token_hash          TEXT NOT NULL,
  default_role        TEXT NOT NULL DEFAULT 'editor',
  created_by_guest_id UUID NOT NULL REFERENCES guests (id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ,
  revoked_at          TIMESTAMPTZ,
  max_uses            INTEGER,
  use_count           INTEGER NOT NULL DEFAULT 0,

  CHECK (default_role IN ('editor', 'viewer')),
  CHECK (max_uses IS NULL OR max_uses >= 0),
  CHECK (use_count >= 0)
);

CREATE UNIQUE INDEX idx_room_share_links_token_hash
  ON room_share_links (token_hash);

CREATE INDEX idx_room_share_links_room_active
  ON room_share_links (room_id)
  WHERE revoked_at IS NULL;

-- ---------------------------------------------------------------------------
-- 6. Collaboration Documents
-- ---------------------------------------------------------------------------
CREATE TABLE collaboration_documents (
  room_id            UUID PRIMARY KEY REFERENCES rooms (id),
  snapshot           BYTEA NOT NULL,
  state_vector       BYTEA,
  schema_version     INTEGER NOT NULL,
  excalidraw_version TEXT NOT NULL,
  snapshot_sequence  BIGINT NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  compacted_at       TIMESTAMPTZ,
  CONSTRAINT collaboration_documents_snapshot_sequence_nonnegative
    CHECK (snapshot_sequence >= 0)
);

-- ---------------------------------------------------------------------------
-- 7. Assets
-- ---------------------------------------------------------------------------
CREATE TABLE assets (
  id                  UUID PRIMARY KEY,
  room_id             UUID NOT NULL REFERENCES rooms (id),
  created_by_guest_id UUID NOT NULL REFERENCES guests (id),
  kind                TEXT NOT NULL,
  status              TEXT NOT NULL,
  storage_key         TEXT NOT NULL,
  original_filename   TEXT,
  mime_type           TEXT NOT NULL,
  size_bytes          BIGINT,
  checksum_sha256     TEXT,
  duration_ms         INTEGER,
  width_px            INTEGER,
  height_px           INTEGER,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ready_at            TIMESTAMPTZ,
  failed_at           TIMESTAMPTZ,
  archived_at         TIMESTAMPTZ,

  CHECK (kind IN ('image', 'audio', 'export')),
  CHECK (
    status IN ('pending', 'uploading', 'ready', 'failed', 'archived')
  ),
  CHECK (size_bytes IS NULL OR size_bytes >= 0),
  CHECK (duration_ms IS NULL OR duration_ms >= 0),
  CHECK (width_px IS NULL OR width_px >= 0),
  CHECK (height_px IS NULL OR height_px >= 0)
);

CREATE UNIQUE INDEX idx_assets_storage_key
  ON assets (storage_key);

CREATE INDEX idx_assets_room_status
  ON assets (room_id, status);

CREATE INDEX idx_assets_created_by
  ON assets (created_by_guest_id);

CREATE INDEX idx_assets_cleanup_candidates
  ON assets (status, created_at)
  WHERE status IN ('pending', 'failed');

-- ---------------------------------------------------------------------------
-- 8. Audit Events
-- ---------------------------------------------------------------------------
CREATE TABLE audit_events (
  id             UUID PRIMARY KEY,
  room_id        UUID REFERENCES rooms (id),
  actor_guest_id UUID REFERENCES guests (id),
  event_type     TEXT NOT NULL,
  target_type    TEXT,
  target_id      TEXT,
  metadata       JSONB NOT NULL DEFAULT '{}'::jsonb,
  request_id     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_events_room_created
  ON audit_events (room_id, created_at DESC);

CREATE INDEX idx_audit_events_actor_created
  ON audit_events (actor_guest_id, created_at DESC);

CREATE INDEX idx_audit_events_type_created
  ON audit_events (event_type, created_at DESC);

-- =============================================================================
-- Down migration (for isolated test use only)
-- =============================================================================
-- DO NOT invoke during ordinary local or demo startup.
-- =============================================================================
-- DROP TABLE IF EXISTS audit_events CASCADE;
-- DROP TABLE IF EXISTS assets CASCADE;
-- DROP TABLE IF EXISTS collaboration_documents CASCADE;
-- DROP TABLE IF EXISTS room_share_links CASCADE;
-- DROP TABLE IF EXISTS room_memberships CASCADE;
-- DROP TABLE IF EXISTS rooms CASCADE;
-- DROP TABLE IF EXISTS guest_sessions CASCADE;
-- DROP TABLE IF EXISTS guests CASCADE;
