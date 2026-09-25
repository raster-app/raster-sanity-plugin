import React, { Suspense, useCallback } from 'react'
import { getFullSizeUrl } from '@raster/sdk'
import { Box, Dialog } from '@sanity/ui'
import type { AssetFromSource } from 'sanity'
import { RasterBrowserFallback } from './raster-fallback'
import { RasterStudioProvider } from './raster-studio-provider'
import type { RasterAssetSourceProps, RasterItem } from './types'

// Lazy because Studio extracts schemas in Node, and the browser reaches the DOM. The `catch`
// keeps a failed chunk from breaking the form.
const RasterBrowser = React.lazy(() =>
	import('./raster-browser')
		.then((module) => ({ default: module.RasterBrowser }))
		.catch((caught: unknown) => {
			console.error(caught)
			return { default: () => <RasterBrowserFallback label="Raster failed to load." /> }
		})
)

/** The Raster picker, as an image field's asset source. */
export function RasterAssetSource(props: RasterAssetSourceProps) {
	const { config, onSelect, onClose, dialogHeaderTitle } = props

	const handlePick = useCallback(
		(item: RasterItem) => {
			// A search hit has no `url` of its own, only renditions.
			const url = getFullSizeUrl(item)
			if (url === null) return

			const asset: AssetFromSource = {
				kind: 'url',
				value: url,
				// biome-ignore lint/plugin: Sanity types this as a stored `ImageAsset`; Studio fills in the rest once it has the file.
				assetDocumentProps: {
					originalFilename: item.name ?? undefined,
					source: {
						name: 'raster',
						// Always the asset, even for a variant, so a document can tell which asset it
						// holds; `url` still opens the exact variant that was picked.
						id: item.parentId ?? item.id,
						url: item.appUrl ?? undefined,
					},
					...('description' in item && item.description != null && item.description !== ''
						? { description: item.description }
						: {}),
				} as AssetFromSource['assetDocumentProps'],
			}

			onSelect([asset])
			onClose()
		},
		[onSelect, onClose]
	)

	return (
		<Dialog
			header={dialogHeaderTitle ?? 'Select an image from Raster'}
			id="raster-asset-picker"
			onClose={onClose}
			width={4}
			position="fixed"
			zOffset={99999999}
			style={{ height: '96vh', marginTop: '40px' }}
		>
			<Box padding={4} style={{ height: '100%', minHeight: 0 }}>
				<RasterStudioProvider>
					<Suspense fallback={<RasterBrowserFallback />}>
						<RasterBrowser config={config} onPick={handlePick} pickLabel="Use this image" />
					</Suspense>
				</RasterStudioProvider>
			</Box>
		</Dialog>
	)
}
