import {
  createRasterClient,
  localStorageCredentialStore,
  localStorageStateStore,
  type RasterClient,
} from "@raster/sdk";
import { type RasterConfig } from "./types";

const DEFAULT_PREFIX = "raster";

/**
 * One client per storage namespace, built lazily and kept for the life of the page.
 *
 * The SDK is deliberate about this: a second client means a second session store, and two
 * stores holding one credential can rotate each other's refresh token into oblivion — which
 * Raster treats as theft and answers by revoking the connection. So the client must not be
 * created during render, and two components reading the same namespace must get the same
 * instance.
 *
 * Keyed on the namespace rather than kept in a module-level constant, because a page can
 * mount several studios: each names its own `storageKeyPrefix` and they never see each
 * other's credential.
 */
const clients = new Map<string, RasterClient>();

/** The `localStorage` namespace this config's session lives in. */
export function storagePrefix(config: RasterConfig): string {
  return config.storageKeyPrefix ?? DEFAULT_PREFIX;
}

/** The organization the config pins the plugin to, if any. */
export function pinnedOrganizationId(config: RasterConfig): string | null {
  return config.organizationId ?? config.orgId ?? null;
}

export function getRasterClient(config: RasterConfig): RasterClient {
  const prefix = storagePrefix(config);
  // The origins are part of the identity: a client pointed at a different API would be a
  // different session, and sharing one store between them would mix the two.
  const key = [prefix, config.apiOrigin ?? "", config.authOrigin ?? ""].join("|");

  const existing = clients.get(key);
  if (existing !== undefined) return existing;

  const client = createRasterClient({
    host: {
      name: config.hostName ?? "Sanity",
      // Studio has a real window, so the device flow's consent page is a plain new tab.
      openExternal: (url) => {
        window.open(url, "_blank", "noopener,noreferrer");
      },
    },
    // Studio is an admin UI on an origin the team controls, and the alternative is asking
    // every editor to sign in again on every reload. It does mean the bearer token is
    // readable by any script on that origin; `storageKeyPrefix` is how a studio keeps
    // several sessions apart, not a security boundary.
    credentials: localStorageCredentialStore(`${prefix}.credentials`),
    state: localStorageStateStore(`${prefix}.state.`),
    apiOrigin: config.apiOrigin,
    authOrigin: config.authOrigin,
  });

  clients.set(key, client);
  return client;
}
