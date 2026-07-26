import { verifyCollaborationToken } from "@vega/auth";
import {
  collaborationModeForRole,
  type CollaborationAccessClaims,
} from "@vega/contracts/collaboration-token";
import type { Pool } from "@vega/database";
import { withClient } from "@vega/database";

export interface AuthResult {
  ok: true;
  claims: CollaborationAccessClaims;
}

export interface AuthRejection {
  ok: false;
  code: string;
  reason: string;
}

const DOCUMENT_PREFIX = "room:";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export function parseDocumentName(name: string): string | null {
  if (!name.startsWith(DOCUMENT_PREFIX)) return null;
  const roomId = name.slice(DOCUMENT_PREFIX.length);
  if (!UUID_PATTERN.test(roomId)) return null;
  return roomId;
}

export async function authenticateConnection(
  pool: Pool,
  signingSecret: string,
  documentName: string,
  token: string,
): Promise<AuthResult | AuthRejection> {
  const roomId = parseDocumentName(documentName);
  if (!roomId) {
    return { ok: false, code: "COLLAB_PERMISSION_DENIED", reason: `Invalid document name: ${documentName}` };
  }

  let claims: CollaborationAccessClaims;
  try {
    claims = verifyCollaborationToken(token, signingSecret);
  } catch {
    return { ok: false, code: "COLLAB_SESSION_INVALID", reason: "Invalid or expired collaboration token" };
  }

  if (claims.roomId !== roomId) {
    return { ok: false, code: "COLLAB_PERMISSION_DENIED", reason: "Token room mismatch" };
  }

  const dbResult = await withClient(pool, async (client) => {
    const sessionResult = await client.query<{
      guest_id: string;
      expires_at: Date | string;
      revoked_at: Date | string | null;
      disabled_at: Date | string | null;
    }>(
      `SELECT s.guest_id, s.expires_at, s.revoked_at, g.disabled_at
       FROM guest_sessions s
       JOIN guests g ON g.id = s.guest_id
       WHERE s.id = $1`,
      [claims.sessionId],
    );
    const session = sessionResult.rows[0];
    if (!session || session.guest_id !== claims.guestId) {
      return { ok: false as const, code: "COLLAB_SESSION_INVALID" as const, reason: "Session not found" };
    }
    const expiresAt =
      session.expires_at instanceof Date
        ? session.expires_at
        : new Date(session.expires_at);
    if (session.revoked_at || session.disabled_at || expiresAt <= new Date()) {
      return { ok: false as const, code: "COLLAB_SESSION_INVALID" as const, reason: "Session revoked" };
    }

    const memberResult = await client.query<{ role: string; status: string }>(
      `SELECT m.role, r.status
       FROM rooms r
       JOIN room_memberships m
         ON m.room_id = r.id
        AND m.guest_id = $2
        AND m.revoked_at IS NULL
       WHERE r.id = $1`,
      [claims.roomId, claims.guestId],
    );
    const authority = memberResult.rows[0];
    if (!authority) {
      return { ok: false as const, code: "COLLAB_PERMISSION_DENIED" as const, reason: "No active membership" };
    }
    if (authority.status !== "active") {
      return { ok: false as const, code: "COLLAB_ROOM_ARCHIVED" as const, reason: "Room is archived" };
    }

    if (
      authority.role !== "owner" &&
      authority.role !== "editor" &&
      authority.role !== "viewer"
    ) {
      return { ok: false as const, code: "COLLAB_PERMISSION_DENIED" as const, reason: "Invalid membership role" };
    }
    const role: CollaborationAccessClaims["role"] = authority.role;

    return {
      ok: true as const,
      claims: {
        ...claims,
        role,
        mode: collaborationModeForRole(role),
      },
    };
  });

  return dbResult;
}
