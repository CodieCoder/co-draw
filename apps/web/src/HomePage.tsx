import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Navigate, useNavigate } from "react-router";

import {
  createRoom,
  getCurrentSession,
} from "./api.js";

export function HomePage() {
  const [roomName, setRoomName] = useState("");
  const navigate = useNavigate();
  const session = useQuery({
    queryKey: ["current-session"],
    queryFn: getCurrentSession,
  });
  const roomCreation = useMutation({
    mutationFn: () => createRoom(roomName.trim() || undefined),
    onSuccess: (result) => {
      void navigate(`/rooms/${result.room.id}`);
    },
  });

  if (session.isPending) {
    return <main><p>Restoring session…</p></main>;
  }
  if (session.isError) {
    return <Navigate to="/guest" replace />;
  }

  return (
    <main>
      <h1>Vega Canvas</h1>
      <p data-testid="current-guest">
        Signed in as {session.data.guest.username}
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          roomCreation.mutate();
        }}
      >
        <label htmlFor="room-name">Room name</label>
        <input
          id="room-name"
          value={roomName}
          maxLength={200}
          placeholder="Untitled Canvas"
          onChange={(event) => setRoomName(event.target.value)}
        />
        <button type="submit" disabled={roomCreation.isPending}>
          {roomCreation.isPending ? "Creating…" : "Create room"}
        </button>
      </form>
      {roomCreation.error instanceof Error ? (
        <p role="alert">{roomCreation.error.message}</p>
      ) : null}
    </main>
  );
}
