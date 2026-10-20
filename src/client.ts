import {
	connectSharedApiKey,
	createRasterClient,
	localStorageCredentialStore,
	localStorageStateStore,
	memoryCredentialStore,
	type RasterClient,
	type StateStore,
} from '@raster-app/react'
import { QueryClient } from '@tanstack/react-query'

const HOST = {
	/** What Raster's consent page, Connected apps and the sign-in screen call this host. */
	name: 'Sanity Studio',
	openExternal: (url: string) => {
		window.open(url, '_blank', 'noopener,noreferrer')
	},
}

/**
 * What a workspace's Raster sign-in, browsing state and caches are kept under. The project and
 * dataset are in it so studios sharing an origin, such as several run on localhost:3333, don't
 * share one under the default workspace name.
 */
export function rasterScope(
	workspace: { name: string; projectId: string; dataset: string },
	orgId: string | undefined
): string {
	const scope = `raster.${workspace.projectId}.${workspace.dataset}.${workspace.name}`
	return orgId === undefined ? scope : `${scope}.org.${orgId}`
}

// One per scope, each with its own sign-in, so one made without the pin is never reused under
// it. The query cache lives as long, so reopening the picker doesn't fetch everything again.
const clients = new Map<
	string,
	{ client: RasterClient; state: StateStore; queryClient: QueryClient }
>()

export function getRasterClient(scope: string): {
	client: RasterClient
	state: StateStore
	queryClient: QueryClient
} {
	const existing = clients.get(scope)
	if (existing !== undefined) return existing

	const created = {
		client: createRasterClient({
			host: HOST,
			credentials: localStorageCredentialStore(`${scope}.credentials`),
		}),
		state: localStorageStateStore(`${scope}.state.`),
		// RasterProvider's own defaults, which it applies only to a QueryClient it creates.
		queryClient: new QueryClient({
			defaultOptions: { queries: { staleTime: 60 * 1000, refetchOnWindowFocus: false } },
		}),
	}
	clients.set(scope, created)
	return created
}

/** Checks a key with Raster without storing it anywhere. */
export async function verifyApiKey(apiKey: string, orgId: string | undefined): Promise<void> {
	const client = createRasterClient({ host: HOST, credentials: memoryCredentialStore() })
	await connectSharedApiKey(client, { apiKey, organizationId: orgId })
}
