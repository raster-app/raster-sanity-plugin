import { useState } from 'react'
import { getFullSizeUrl, type Asset } from '@raster-app/react'
import { Box, Card, Dialog, Text } from '@sanity/ui'
import type { AssetFromSource } from 'sanity'
import { RasterStudioPicker } from './raster-studio-picker'
import { isImage, type RasterAssetSourceProps } from './types'

/** The Raster picker, as an image field's asset source. */
export function RasterAssetSource(props: RasterAssetSourceProps) {
	const { config, onSelect, onClose, dialogHeaderTitle } = props
	const [refused, setRefused] = useState(false)

	function handlePick(asset: Asset) {
		// Sanity would only fail on it after the dialog has closed.
		if (!isImage(asset)) {
			setRefused(true)
			return
		}
		const url = getFullSizeUrl(asset)
		if (url === null) return

		const picked: AssetFromSource = {
			kind: 'url',
			value: url,
			// biome-ignore lint/plugin: Sanity types this as a stored `ImageAsset`; Studio fills in the rest once it has the file.
			assetDocumentProps: {
				originalFilename: asset.name ?? undefined,
				source: {
					name: 'raster',
					// Always the asset, even for a variant, so a document can tell which asset it
					// holds; `url` still opens the exact variant that was picked.
					id: asset.parentId ?? asset.id,
					url: asset.appUrl ?? undefined,
				},
				// An original's only: the asset document of a variant carries none.
				...(asset.parentId === null && asset.description ? { description: asset.description } : {}),
			} as AssetFromSource['assetDocumentProps'],
		}

		onSelect([picked])
		onClose()
	}

	return (
		<Dialog
			header={dialogHeaderTitle ?? 'Select an image from Raster'}
			id="raster-asset-picker"
			onClose={onClose}
			width={4}
			position="fixed"
			zOffset={99999999}
			footer={
				refused ? (
					<Card tone="caution" padding={3} role="alert">
						<Text size={1}>Only images can be used in this field.</Text>
					</Card>
				) : undefined
			}
		>
			{/* The dialog sizes to its content, and the picker needs a fixed height to scroll in. */}
			<Box style={{ height: '80vh' }}>
				<RasterStudioPicker config={config} onPick={handlePick} />
			</Box>
		</Dialog>
	)
}
