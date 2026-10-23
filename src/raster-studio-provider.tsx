import type { ReactNode } from 'react'
import { RasterProvider, scopedRaster } from '@raster-app/react'
import { useWorkspace } from 'sanity'
import { HOST, rasterScope } from './client'
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
	const workspace = useWorkspace()
	const scope = rasterScope(workspace, config.orgId)
	const studioKey = useStudioKeyDocument(scope, config.orgId)

	// Until the key is read, the picker would offer to sign in before it can connect the key.
	if (studioKey.key === undefined) return <LoadingState label="Connecting to Raster…" />

	return (
		<StudioKeyProvider value={studioKey}>
			{/* The provider keeps the client it mounted with, so another scope remounts it. */}
			<RasterProvider key={scope} {...scopedRaster(scope, HOST)}>
				{children}
			</RasterProvider>
		</StudioKeyProvider>
	)
}
