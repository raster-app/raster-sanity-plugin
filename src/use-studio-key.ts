import { createContext, useContext, useEffect, useState } from 'react'
import { useClient } from 'sanity'

// Sanity only returns documents whose id contains a dot to signed-in users. One per pinned
// organization, so workspaces on the same dataset pinned to different ones keep their own key.
function secretsId(orgId: string | undefined): string {
	return orgId === undefined ? 'secrets.raster' : `secrets.raster.${orgId}`
}

type SecretsDocument = { apiKey?: string }

export type StudioKey = {
	/** Undefined while it is being read, null when none is saved. */
	key: string | null | undefined
	save: (key: string) => Promise<void>
	remove: () => Promise<void>
}

const StudioKeyContext = createContext<StudioKey | null>(null)

export const StudioKeyProvider = StudioKeyContext.Provider

/** The key read by `RasterStudioProvider`. */
export function useStudioKey(): StudioKey {
	const studioKey = useContext(StudioKeyContext)
	if (studioKey === null) throw new Error('useStudioKey must be used inside RasterStudioProvider')
	return studioKey
}

// Per scope (see `rasterScope`), read once per page like the client it picks, so reopening the
// picker doesn't wait on it. A failed read isn't kept, so the next open reads again.
const savedKeys = new Map<string, string | null>()

/** Reads and writes the API key an admin saved for the studio, or for its pinned organization. */
export function useStudioKeyDocument(scope: string, orgId: string | undefined): StudioKey {
	/** Context */
	const client = useClient({ apiVersion: '2025-01-01' })

	/** State */
	const [read, setRead] = useState<{ scope: string; key: string | null } | null>(null)

	/** Derived */
	const id = secretsId(orgId)
	const key = savedKeys.has(scope)
		? savedKeys.get(scope)
		: read?.scope === scope
			? read.key
			: undefined

	/** Handlers */
	function remember(next: string | null) {
		savedKeys.set(scope, next)
		setRead({ scope, key: next })
	}

	async function save(next: string) {
		await client.createOrReplace({ _id: id, _type: 'rasterSecrets', apiKey: next })
		remember(next)
	}

	async function remove() {
		await client.delete(id)
		remember(null)
	}

	/** Effects */
	useEffect(() => {
		if (savedKeys.has(scope)) return
		let cancelled = false
		client.getDocument<SecretsDocument>(id).then(
			(document) => {
				const next = document?.apiKey || null
				savedKeys.set(scope, next)
				if (!cancelled) setRead({ scope, key: next })
			},
			(caught: unknown) => {
				// Unreadable counts as unsaved, so editors can still sign in themselves.
				console.error(caught)
				if (!cancelled) setRead({ scope, key: null })
			}
		)
		return () => {
			cancelled = true
		}
	}, [client, id, scope])

	return { key, save, remove }
}
