import { createContext, useContext, useEffect, useState } from "react";
import { useClient } from "sanity";

// Sanity only returns documents whose id contains a dot to signed-in users.
const SECRETS_ID = "secrets.raster";

type SecretsDocument = { apiKey?: string };

export type StudioKey = {
  /** Undefined while it is being read, null when none is saved. */
  key: string | null | undefined;
  save: (key: string) => Promise<void>;
  remove: () => Promise<void>;
};

const StudioKeyContext = createContext<StudioKey | null>(null);

export const StudioKeyProvider = StudioKeyContext.Provider;

/** The key read by `RasterStudioProvider`. */
export function useStudioKey(): StudioKey {
  const studioKey = useContext(StudioKeyContext);
  if (studioKey === null) throw new Error("useStudioKey must be used inside RasterStudioProvider");
  return studioKey;
}

/** Reads and writes the API key an admin saved in `secrets.raster`. */
export function useStudioKeyDocument(): StudioKey {
  /** Context */
  const client = useClient({ apiVersion: "2025-01-01" });

  /** State */
  const [key, setKey] = useState<string | null | undefined>(undefined);

  /** Handlers */
  async function save(next: string) {
    await client.createOrReplace({ _id: SECRETS_ID, _type: "rasterSecrets", apiKey: next });
    setKey(next);
  }

  async function remove() {
    await client.delete(SECRETS_ID);
    setKey(null);
  }

  /** Effects */
  useEffect(() => {
    let cancelled = false;
    client.getDocument<SecretsDocument>(SECRETS_ID).then(
      (document) => {
        if (!cancelled) setKey(document?.apiKey || null);
      },
      (caught: unknown) => {
        // Unreadable counts as unsaved, so editors can still sign in themselves.
        console.error(caught);
        if (!cancelled) setKey(null);
      }
    );
    return () => {
      cancelled = true;
    };
  }, [client]);

  return { key, save, remove };
}
