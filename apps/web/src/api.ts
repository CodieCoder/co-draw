import { apiErrorResponseSchema } from "@vega/contracts/errors";

let apiBaseUrl: string | null = null;

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export function configureApiClient(baseUrl: string): void {
  apiBaseUrl = baseUrl.replace(/\/$/u, "");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error("API client is not configured");
  }

  const response = await fetch(`${apiBaseUrl}/api/v1${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    const parsed = apiErrorResponseSchema.safeParse(payload);
    if (parsed.success) {
      throw new ApiClientError(
        parsed.data.error.message,
        parsed.data.error.code,
        response.status,
        parsed.data.error.requestId,
      );
    }
    throw new ApiClientError(
      "The request could not be completed",
      "UNEXPECTED_RESPONSE",
      response.status,
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export interface GuestSessionResponse {
  guest: { id: string; username: string; colour: string };
  session: { expiresAt: string };
}

export interface RoomResponse {
  room: {
    id: string;
    name: string;
    status: "active" | "archived";
    role?: "owner";
    createdAt: string;
    updatedAt?: string;
    archivedAt?: string;
  };
  membership?: { guestId: string; role: "owner" | "editor" | "viewer" };
  capabilities?: {
    canView: boolean;
    canEdit: boolean;
    canManageMembers: boolean;
  } & Record<string, boolean>;
}

export interface ShareLinkResponse {
  shareLink: {
    id: string;
    url: string;
    defaultRole: "editor";
    createdAt: string;
    expiresAt?: string;
    maxUses?: number;
  };
}

export interface ResolveShareLinkResponse {
  room: { id: string; name: string; status: "active" | "archived" };
  invitation: {
    defaultRole: "editor" | "viewer";
    requiresGuestSession: boolean;
  };
}

export interface AcceptShareLinkResponse {
  room: { id: string; name: string; status: "active" | "archived" };
  membership: { role: "editor" | "viewer" };
}

export interface CollaborationBootstrapResponse {
  room: { id: string; status: "active" | "archived" };
  guest: { id: string; username: string; colour: string };
  access: {
    role: "owner" | "editor" | "viewer";
    mode: "read-write" | "read-only";
  };
  collaboration: {
    documentName: string;
    websocketUrl: string;
    accessToken: string;
    expiresAt: string;
    schemaVersion: number;
  };
}

export function createGuestSession(
  username: string,
  email: string,
): Promise<GuestSessionResponse> {
  return request<GuestSessionResponse>("/guest-sessions", {
    method: "POST",
    body: JSON.stringify({ username, email }),
  });
}

export function getCurrentSession(): Promise<GuestSessionResponse> {
  return request<GuestSessionResponse>("/guest-sessions/current");
}

export function createRoom(name?: string): Promise<RoomResponse> {
  return request<RoomResponse>("/rooms", {
    method: "POST",
    body: JSON.stringify(name ? { name } : {}),
  });
}

export function getRoom(roomId: string): Promise<RoomResponse> {
  return request<RoomResponse>(`/rooms/${encodeURIComponent(roomId)}`);
}

export function getCollaborationBootstrap(
  roomId: string,
): Promise<CollaborationBootstrapResponse> {
  return request<CollaborationBootstrapResponse>(
    `/rooms/${encodeURIComponent(roomId)}/collaboration`,
  );
}

export function createShareLink(roomId: string): Promise<ShareLinkResponse> {
  return request<ShareLinkResponse>(
    `/rooms/${encodeURIComponent(roomId)}/share-links`,
    {
      method: "POST",
      body: JSON.stringify({ defaultRole: "editor" }),
    },
  );
}

export function resolveShareLink(
  token: string,
): Promise<ResolveShareLinkResponse> {
  return request<ResolveShareLinkResponse>(
    `/share-links/${encodeURIComponent(token)}`,
  );
}

export function acceptShareLink(
  token: string,
): Promise<AcceptShareLinkResponse> {
  return request<AcceptShareLinkResponse>(
    `/share-links/${encodeURIComponent(token)}/accept`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
}
