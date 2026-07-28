import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router";

import {
  createShareLink,
  getCollaborationBootstrap,
  getRoom,
} from "./api.js";
import { CanvasController } from "./CanvasController.js";
import {
  type ConnectionStatus,
  useRoomProvider,
} from "./RoomProvider.js";
import { updateCanvasTestState } from "./canvas-test-api/state.js";

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  disconnected: "Disconnected",
  connecting: "Connecting…",
  connected: "Connected",
  reconnecting: "Reconnecting…",
  failed: "Connection failed",
};

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const room = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => getRoom(roomId!),
    enabled: Boolean(roomId),
  });
  const bootstrap = useQuery({
    queryKey: ["collaboration-bootstrap", roomId],
    queryFn: () => getCollaborationBootstrap(roomId!),
    enabled: Boolean(roomId),
    staleTime: 4 * 60 * 1_000,
  });
  const collaboration = useRoomProvider(
    roomId ?? null,
    bootstrap.data ?? null,
  );
  const participant = useMemo(
    () =>
      bootstrap.data
        ? {
            guestId: bootstrap.data.guest.id,
            username: bootstrap.data.guest.username,
            colour: bootstrap.data.guest.colour,
            role: bootstrap.data.access.role,
          }
        : null,
    [bootstrap.data],
  );
  const shareCreation = useMutation({
    mutationFn: () => createShareLink(roomId!),
    onSuccess: (result) => setShareUrl(result.shareLink.url),
  });

  useEffect(() => {
    const membership = room.data?.membership;
    updateCanvasTestState({
      room:
        roomId && room.data && membership
          ? {
              id: roomId,
              status: room.data.room.status,
              role: membership.role,
            }
          : null,
    });
  }, [room.data, roomId]);

  if (!roomId) {
    return <main><p role="alert">Room not found.</p></main>;
  }

  const error = room.error ?? bootstrap.error ?? collaboration.error;
  if (error) {
    return (
      <main>
        <p role="alert">
          {error instanceof Error ? error.message : "The room could not load."}
        </p>
        <button type="button" onClick={() => void navigate("/")}>
          Go home
        </button>
      </main>
    );
  }

  const canShare = room.data?.capabilities?.canManageMembers === true;

  return (
    <main style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <header
        style={{
          alignItems: "center",
          background: "#f0f0f0",
          display: "flex",
          gap: "8px",
          padding: "8px",
        }}
      >
        <strong>{room.data?.room.name ?? "Loading room…"}</strong>
        <span data-testid="connection-status">
          {STATUS_LABEL[collaboration.status]}
        </span>
        {canShare ? (
          <button
            type="button"
            disabled={shareCreation.isPending}
            onClick={() => shareCreation.mutate()}
          >
            {shareCreation.isPending ? "Creating…" : "Create share link"}
          </button>
        ) : null}
        {shareUrl ? (
          <>
            <input
              aria-label="Share link"
              readOnly
              value={shareUrl}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => void navigator.clipboard.writeText(shareUrl)}
            >
              Copy
            </button>
          </>
        ) : null}
        <button type="button" onClick={() => void navigate("/")}>
          Home
        </button>
      </header>
      {shareCreation.error instanceof Error ? (
        <p role="alert">{shareCreation.error.message}</p>
      ) : null}
      <section style={{ flex: 1, minHeight: 0 }} aria-label="Shared canvas">
        {collaboration.ydoc ? (
          <CanvasController
            ydoc={collaboration.ydoc}
            roomId={roomId}
            provider={collaboration.provider}
            {...(participant ? { participant } : {})}
            canUploadAssets={
              room.data?.capabilities?.canUploadAssets === true
            }
          />
        ) : (
          <p>Connecting to room…</p>
        )}
      </section>
    </main>
  );
}
