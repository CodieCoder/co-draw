import type {
  Browser,
  BrowserContext,
  Page,
} from "@playwright/test";

import {
  createSyntheticActors,
  type SyntheticActor,
  type SyntheticActorKey,
} from "./index.js";

export interface CollaboratorContext {
  readonly actor: SyntheticActor;
  readonly context: BrowserContext;
  readonly page: Page;
}

export type CollaboratorContexts = Readonly<
  Record<SyntheticActorKey, CollaboratorContext>
> & {
  close(): Promise<void>;
};

export interface CollaboratorContextOptions {
  readonly baseUrl: string;
  readonly runId: string;
}

const validateBaseUrl = (value: string): string => {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Collaborator context base URL is invalid.");
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username !== "" ||
    url.password !== ""
  ) {
    throw new Error("Collaborator context base URL is invalid.");
  }

  return url.toString();
};

export const createCollaboratorContexts = async (
  browser: Browser,
  options: CollaboratorContextOptions,
): Promise<CollaboratorContexts> => {
  const actors = createSyntheticActors(options.runId);
  const baseURL = validateBaseUrl(options.baseUrl);
  const openedContexts: BrowserContext[] = [];

  try {
    const entries = await Promise.all(
      (Object.keys(actors) as SyntheticActorKey[]).map(async (key) => {
        const context = await browser.newContext({ baseURL });
        openedContexts.push(context);
        const page = await context.newPage();
        return [
          key,
          Object.freeze({
            actor: actors[key],
            context,
            page,
          }),
        ] as const;
      }),
    );

    let closed = false;
    const contexts = Object.fromEntries(entries) as Record<
      SyntheticActorKey,
      CollaboratorContext
    >;

    return Object.freeze({
      ...contexts,
      close: async () => {
        if (closed) {
          return;
        }
        closed = true;
        await Promise.allSettled(
          openedContexts.map(async (context) => context.close()),
        );
      },
    });
  } catch (error: unknown) {
    await Promise.allSettled(
      openedContexts.map(async (context) => context.close()),
    );
    throw error;
  }
};
