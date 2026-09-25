import {
  createRasterClient,
  localStorageCredentialStore,
  localStorageStateStore,
  type RasterClient,
} from "@raster/sdk";
import { type RasterConfig } from "./types";

/**
 * One client per Studio workspace, built lazily and kept for the life of the page, so every
 * component in a workspace shares one session. Workspaces can pin different organizations,
 * so each gets its own client and credential rather than the first one to load winning — see
 * the SDK's "The client is an instance, not a singleton":
 * https://github.com/raster-app/raster-sdk#the-client-is-an-instance-not-a-singleton
 */
const clients = new Map<string, RasterClient>();

/** The organization the config pins the plugin to, if any. */
export function pinnedOrganizationId(config: RasterConfig): string | null {
  return config.organizationId ?? config.orgId ?? null;
}

export function getRasterClient(config: RasterConfig, workspace: string): RasterClient {
  const existing = clients.get(workspace);
  if (existing !== undefined) return existing;

  const prefix = `raster.${workspace}`;
  const client = createRasterClient({
    host: {
      name: config.hostName ?? "Sanity",
      // Studio has a real window, so the device flow's consent page is a plain new tab.
      openExternal: (url) => {
        window.open(url, "_blank", "noopener,noreferrer");
      },
    },
    // Kept in `localStorage` so editors do not sign in again on every reload. Any script or
    // plugin on the Studio's origin can read it.
    credentials: localStorageCredentialStore(`${prefix}.credentials`),
    state: localStorageStateStore(`${prefix}.state.`),
  });

  clients.set(workspace, client);
  return client;
}
