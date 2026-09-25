import React, { Suspense } from 'react'
import { Box } from '@sanity/ui'
import { RasterBrowserFallback } from './raster-fallback'
import { RasterStudioProvider } from './raster-studio-provider'
import type { RasterToolProps } from './types'

// Lazy for the same reason as in `RasterAssetSource`.
const RasterBrowser = React.lazy(() =>
	import('./raster-browser')
		.then((module) => ({ default: module.RasterBrowser }))
		.catch((caught: unknown) => {
			console.error(caught)
			return { default: () => <RasterBrowserFallback label="Raster failed to load." /> }
		})
)

/**
 * Raster as a Studio tool: the same browser, with the whole pane to work in, and where an
 * admin saves the studio's API key.
 */
export function RasterTool({ config }: RasterToolProps) {
	return (
		<Box padding={4} style={{ height: '100%', minHeight: 0 }}>
			<RasterStudioProvider>
				<Suspense fallback={<RasterBrowserFallback />}>
					<RasterBrowser config={config} allowStudioKeySetup />
				</Suspense>
			</RasterStudioProvider>
		</Box>
	)
}
