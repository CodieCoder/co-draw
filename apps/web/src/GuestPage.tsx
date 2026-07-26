import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router";

import { createGuestSession } from "./api.js";

function safeReturnPath(candidate: string | null): string {
  if (
    candidate &&
    candidate.startsWith("/invite/") &&
    !candidate.startsWith("//")
  ) {
    return candidate;
  }
  return "/";
}

export function GuestPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const registration = useMutation({
    mutationFn: () => createGuestSession(username, email),
    onSuccess: (session) => {
      queryClient.setQueryData(["current-session"], session);
      queryClient.removeQueries({ queryKey: ["share-link"] });
      void navigate(safeReturnPath(searchParams.get("returnTo")), {
        replace: true,
      });
    },
  });

  return (
    <main>
      <h1>Create a private guest identity</h1>
      <p>Your email is used only for this private guest session.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          registration.mutate();
        }}
      >
        <label htmlFor="guest-username">Username</label>
        <input
          id="guest-username"
          name="username"
          autoComplete="nickname"
          minLength={2}
          maxLength={40}
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <label htmlFor="guest-email">Email</label>
        <input
          id="guest-email"
          name="email"
          type="email"
          autoComplete="email"
          maxLength={254}
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <button type="submit" disabled={registration.isPending}>
          {registration.isPending ? "Creating…" : "Continue"}
        </button>
      </form>
      {registration.error instanceof Error ? (
        <p role="alert">{registration.error.message}</p>
      ) : null}
    </main>
  );
}
