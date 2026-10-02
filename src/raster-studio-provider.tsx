import type { ReactNode } from 'react'
import { RasterProvider } from '@raster-app/react'
import { useWorkspace } from 'sanity'
import { getRasterClient } from './client'
import { LoadingState } from './loading-state'
import type { RasterConfig } from './types'
import { StudioKeyProvider, useStudioKeyDocument } from './use-studio-key'

/** The workspace's Raster client, and the API key saved for the studio. */
export function RasterStudioProvider({
	config,
	children,
}: {
	config: RasterConfig
	children: ReactNode
}) {
	const workspace = useWorkspace().name
	const studioKey = useStudioKeyDocument()

	// Which credential store the client gets depends on whether a key is saved.
	if (studioKey.key === undefined) return <LoadingState label="Connecting to Raster…" />

	const hasStudioKey = studioKey.key !== null
	const { client, state } = getRasterClient(workspace, config.orgId, hasStudioKey)

	return (
		<StudioKeyProvider value={studioKey}>
			{/* The provider keeps the client it mounted with, so saving or removing a key remounts it. */}
			<RasterProvider key={hasStudioKey ? 'studio-key' : 'session'} client={client} state={state}>
				{children}
			</RasterProvider>
		</StudioKeyProvider>
	)
}
