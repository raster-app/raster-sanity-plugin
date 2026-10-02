import {
	createRasterClient,
	localStorageCredentialStore,
	localStorageStateStore,
	memoryCredentialStore,
	RasterApiError,
	type RasterClient,
	type StateStore,
} from '@raster-app/react'

const HOST = {
	/** What Raster's consent page, Connected apps and the sign-in screen call this host. */
	name: 'Sanity Studio',
	openExternal: (url: string) => {
		window.open(url, '_blank', 'noopener,noreferrer')
	},
}

// One per workspace and pinned organization, each with its own sign-in, so one made without
// the pin is never reused under it.
const clients = new Map<string, { client: RasterClient; state: StateStore }>()

/**
 * With a studio key, the credential is kept in memory and connected on every load, so a
 * rotated key takes effect on the next one instead of a stored copy outliving it.
 */
export function getRasterClient(
	workspace: string,
	orgId: string | undefined,
	hasStudioKey: boolean
): { client: RasterClient; state: StateStore } {
	const prefix = orgId === undefined ? `raster.${workspace}` : `raster.${workspace}.org.${orgId}`
	const cacheKey = `${prefix}|${hasStudioKey ? 'studio-key' : 'session'}`
	const existing = clients.get(cacheKey)
	if (existing !== undefined) return existing

	const created = {
		client: createRasterClient({
			host: HOST,
			credentials: hasStudioKey
				? memoryCredentialStore()
				: localStorageCredentialStore(`${prefix}.credentials`),
		}),
		state: localStorageStateStore(`${prefix}.state.`),
	}
	clients.set(cacheKey, created)
	return created
}

/**
 * Connects an organization API key. `auth.connect` can't bind a key to an organization, so a
 * pinned studio checks the one the key reached and refuses any other.
 */
export async function connectStudioKey(
	client: RasterClient,
	apiKey: string,
	orgId: string | undefined
): Promise<void> {
	const { organizations } = await client.auth.connect({ apiKey })
	if (orgId === undefined || organizations.some((organization) => organization.id === orgId)) return
	await client.auth.signOut()
	throw new RasterApiError(
		`That key is for another Raster organization than ${orgId}.`,
		'ORGANIZATION_MISMATCH',
		403
	)
}

/** Checks a key with Raster without storing it anywhere. */
export async function verifyApiKey(apiKey: string, orgId: string | undefined): Promise<void> {
	const client = createRasterClient({ host: HOST, credentials: memoryCredentialStore() })
	await connectStudioKey(client, apiKey, orgId)
}
