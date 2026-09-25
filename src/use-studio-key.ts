import { useEffect, useState } from "react";
import { useClient } from "sanity";

/**
 * The document an admin saves the studio's Raster key in. An id with a dot is a path, and
 * Sanity only returns those to signed-in users — never to the public API.
 */
const SECRETS_ID = "secrets.raster";

type SecretsDocument = { apiKey?: string };

export type StudioKey = {
  /** Undefined while it is being read, null when none is saved. */
  key: string | null | undefined;
  save: (key: string) => Promise<void>;
  remove: () => Promise<void>;
};

/**
 * The organization API key an admin saved for everyone using this studio's dataset, read and
 * written with the Studio's own client. It lives in the dataset rather than the Studio config
 * so it never ships in the bundle.
 */
export function useStudioKey(): StudioKey {
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
        // Unreadable is treated as unsaved: editors can still sign in themselves.
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
