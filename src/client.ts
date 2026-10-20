import {
	connectApiKey,
	type CredentialStore,
	createRasterClient,
	getMe,
	localStorageCredentialStore,
	localStorageStateStore,
	type Me,
	memoryCredentialStore,
	RasterApiError,
	type RasterClient,
	SIGNED_OUT,
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

// Keys connected as the studio's on this page.
const studioKeys = new Set<string>()

/**
 * Stores an editor's own sign-in, but a studio key only as signed out, keeping the client
 * registration: each load then connects the key saved at that point, so a rotated key takes
 * effect instead of a stored copy outliving it.
 */
function withoutStudioKeys(store: CredentialStore): CredentialStore {
	return {
		...store,
		save: (credentials) =>
			store.save(
				credentials.apiKey !== null && studioKeys.has(credentials.apiKey)
					? { ...SIGNED_OUT, clientId: credentials.clientId }
					: credentials
			),
	}
}

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
			credentials: withoutStudioKeys(localStorageCredentialStore(`${scope}.credentials`)),
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

/**
 * `connectApiKey` can't bind a key to an organization, so a pinned studio checks the one the
 * key reaches before anything adopts it.
 */
async function checkKey(
	client: RasterClient,
	apiKey: string,
	orgId: string | undefined
): Promise<Me> {
	const me = await getMe(client, { bearer: apiKey })
	if (orgId === undefined || ('organizationId' in me && me.organizationId === orgId)) return me
	throw new RasterApiError(
		`That key is for another Raster organization than ${orgId}.`,
		'ORGANIZATION_MISMATCH',
		403
	)
}

/** Connects a signed-out client with an organization API key, once Raster has accepted it. */
export async function connectStudioKey(
	client: RasterClient,
	apiKey: string,
	orgId: string | undefined
): Promise<void> {
	const key = apiKey.trim()
	if (orgId !== undefined) await checkKey(client, key, orgId)
	studioKeys.add(key)
	await connectApiKey(client, { apiKey: key })
}

/** Checks a key with Raster without storing it anywhere. */
export async function verifyApiKey(apiKey: string, orgId: string | undefined): Promise<void> {
	const client = createRasterClient({ host: HOST, credentials: memoryCredentialStore() })
	await checkKey(client, apiKey.trim(), orgId)
}
