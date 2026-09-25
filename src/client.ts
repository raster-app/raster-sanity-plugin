import {
	createRasterClient,
	localStorageCredentialStore,
	localStorageStateStore,
	memoryCredentialStore,
	type RasterClient,
} from '@raster/sdk'

// Per workspace, since workspaces can pin different organizations:
// https://github.com/raster-app/raster-sdk#the-client-is-an-instance-not-a-singleton
const clients = new Map<string, RasterClient>()

/** What Raster's consent page, Connected apps and the sign-in screen call this host. */
export const HOST_NAME = 'Sanity Studio'

const HOST = {
	name: HOST_NAME,
	openExternal: (url: string) => {
		window.open(url, '_blank', 'noopener,noreferrer')
	},
}

/**
 * With a studio key, the credential is kept in memory and connected on every load, so a
 * rotated key takes effect on the next one instead of a stored copy outliving it.
 */
export function getRasterClient(workspace: string, hasStudioKey: boolean): RasterClient {
	const cacheKey = `${workspace}|${hasStudioKey ? 'studio-key' : 'session'}`
	const existing = clients.get(cacheKey)
	if (existing !== undefined) return existing

	const prefix = `raster.${workspace}`
	const client = createRasterClient({
		host: HOST,
		credentials: hasStudioKey
			? memoryCredentialStore()
			: localStorageCredentialStore(`${prefix}.credentials`),
		state: localStorageStateStore(`${prefix}.state.`),
	})

	clients.set(cacheKey, client)
	return client
}

/** Checks a key with Raster without storing it anywhere. */
export async function verifyApiKey(apiKey: string): Promise<void> {
	const client = createRasterClient({ host: HOST, credentials: memoryCredentialStore() })
	await client.auth.connect({ apiKey })
}
