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

/** Reads and writes the API key an admin saved for the studio, or for its pinned organization. */
export function useStudioKeyDocument(orgId: string | undefined): StudioKey {
	/** Context */
	const client = useClient({ apiVersion: '2025-01-01' })

	/** State */
	const [key, setKey] = useState<string | null | undefined>(undefined)

	/** Derived */
	const id = secretsId(orgId)

	/** Handlers */
	async function save(next: string) {
		await client.createOrReplace({ _id: id, _type: 'rasterSecrets', apiKey: next })
		setKey(next)
	}

	async function remove() {
		await client.delete(id)
		setKey(null)
	}

	/** Effects */
	useEffect(() => {
		let cancelled = false
		client.getDocument<SecretsDocument>(id).then(
			(document) => {
				if (!cancelled) setKey(document?.apiKey || null)
			},
			(caught: unknown) => {
				// Unreadable counts as unsaved, so editors can still sign in themselves.
				console.error(caught)
				if (!cancelled) setKey(null)
			}
		)
		return () => {
			cancelled = true
		}
	}, [client, id])

	return { key, save, remove }
}
