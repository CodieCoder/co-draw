import { useEffect, useState } from "react";
import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";

import {
  getCollaborationBootstrap,
  type CollaborationBootstrapResponse,
} from "./api.js";
import { updateCanvasTestState } from "./canvas-test-api/state.js";

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "failed";

export interface RoomProviderState {
  ydoc: Y.Doc | null;
  provider: HocuspocusProvider | null;
  status: ConnectionStatus;
  error: Error | null;
}

export function useRoomProvider(
  roomId: string | null,
  bootstrap: CollaborationBootstrapResponse | null,
): RoomProviderState {
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [status, setStatus] =
    useState<ConnectionStatus>("disconnected");
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!bootstrap || !roomId) return;

    const updateStatus = (nextStatus: ConnectionStatus): void => {
      setStatus(nextStatus);
      updateCanvasTestState({
        collaborationStatus: nextStatus,
        collaborationDocumentName: bootstrap.collaboration.documentName,
      });
    };

    const doc = new Y.Doc();
    setYdoc(doc);
    updateStatus("connecting");

    const activeProvider = new HocuspocusProvider({
      url: bootstrap.collaboration.websocketUrl,
      name: bootstrap.collaboration.documentName,
      document: doc,
      token: async () =>
        (await getCollaborationBootstrap(roomId)).collaboration.accessToken,
      onConnect: () => {
        updateStatus("connected");
        setError(null);
      },
      onDisconnect: () => updateStatus("reconnecting"),
      onClose: () => updateStatus("disconnected"),
      onAuthenticated: () => updateStatus("connected"),
      onAuthenticationFailed: () => {
        updateStatus("failed");
        setError(new Error("Collaboration authentication failed"));
      },
    });

    setProvider(activeProvider);

    return () => {
      activeProvider.destroy();
      doc.destroy();
      updateCanvasTestState({
        collaborationStatus: "disconnected",
        collaborationDocumentName: undefined,
      });
    };
  }, [bootstrap, roomId]);

  return { ydoc, provider, status, error };
}
