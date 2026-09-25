import type { ReactNode } from 'react'
import { RasterProvider } from '@raster/react'
import { useWorkspace } from 'sanity'
import { getRasterClient } from './client'
import { LoadingState } from './loading-state'
import { StudioKeyProvider, useStudioKeyDocument } from './use-studio-key'

/** The workspace's Raster client, and the API key saved for the studio. */
export function RasterStudioProvider({ children }: { children: ReactNode }) {
	const workspace = useWorkspace().name
	const studioKey = useStudioKeyDocument()

	// Which credential store the client gets depends on whether a key is saved.
	if (studioKey.key === undefined) return <LoadingState label="Connecting to Raster…" />

	const client = getRasterClient(workspace, studioKey.key !== null)

	return (
		<StudioKeyProvider value={studioKey}>
			<RasterProvider client={client}>{children}</RasterProvider>
		</StudioKeyProvider>
	)
}
