import { useMutation, useQuery } from "@tanstack/react-query";
import { Navigate, useNavigate, useParams } from "react-router";

import { acceptShareLink, resolveShareLink } from "./api.js";

export function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const invitation = useQuery({
    queryKey: ["share-link", token],
    queryFn: () => resolveShareLink(token!),
    enabled: Boolean(token),
  });
  const acceptance = useMutation({
    mutationFn: () => acceptShareLink(token!),
    onSuccess: (result) => {
      void navigate(`/rooms/${result.room.id}`, { replace: true });
    },
  });

  if (!token) {
    return <main><h1>Invitation error</h1><p role="alert">Invitation is invalid.</p></main>;
  }
  if (invitation.isPending) {
    return <main><p>Loading invitation…</p></main>;
  }
  if (invitation.isError) {
    return (
      <main>
        <h1>Invitation error</h1>
        <p role="alert">
          {invitation.error instanceof Error
            ? invitation.error.message
            : "Invitation is invalid."}
        </p>
      </main>
    );
  }
  if (invitation.data.invitation.requiresGuestSession) {
    const returnTo = `/invite/${token}`;
    return (
      <Navigate
        to={`/guest?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }

  return (
    <main>
      <h1>You&apos;re invited to {invitation.data.room.name}</h1>
      <p>This invitation grants editor access to the shared canvas.</p>
      <button
        type="button"
        disabled={acceptance.isPending}
        onClick={() => acceptance.mutate()}
      >
        {acceptance.isPending ? "Joining…" : "Accept invitation"}
      </button>
      {acceptance.error instanceof Error ? (
        <p role="alert">{acceptance.error.message}</p>
      ) : null}
    </main>
  );
}
