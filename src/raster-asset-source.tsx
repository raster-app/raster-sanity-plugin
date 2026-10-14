import { useState } from 'react'
import { getFullSizeUrl, type Asset } from '@raster-app/react'
import { Box, Card, Dialog, Text } from '@sanity/ui'
import type { AssetFromSource } from 'sanity'
import { RasterStudioPicker } from './raster-studio-picker'
import type { RasterAssetSourceProps } from './types'

const UNTYPED = 'Raster has no file type for this asset, so this field cannot take it.'
const NO_FILE = 'Raster has no file for this asset yet.'

/** Sanity's own test of a file against an `accept` list, which `sanity` does not export. */
function accepts(type: string, name: string, accept: string): boolean {
	if (!accept) return true
	const mimeType = type.toLowerCase()
	return accept.split(',').some((entry) => {
		const token = entry.trim().toLowerCase()
		if (token.startsWith('.')) return name === '' || name.toLowerCase().endsWith(token)
		if (token.endsWith('/*')) return mimeType.replace(/\/.*$/, '') === token.replace(/\/.*$/, '')
		return mimeType === token
	})
}

/** Why the field would not take the asset, as Sanity would judge the file it fetches; or null. */
function whyRefused(asset: Asset, accept: string): string | null {
	const name = asset.name ?? ''
	// Some variant rows carry no type of their own. A variant shares its original's kind, so it
	// is taken as an image of an unrecorded format, which fits only a field that takes any image.
	const type = asset.contentType ?? (asset.parentId === null ? null : 'image/*')
	if (type === null) return UNTYPED
	if (!accepts(type, name, 'image/*')) return 'Only images can be used in this field.'
	if (accepts(type, name, accept)) return null
	return asset.contentType ? `This field only accepts ${accept}.` : UNTYPED
}

/** The Raster picker, as an image field's asset source. */
export function RasterAssetSource(props: RasterAssetSourceProps) {
	const { config, accept, onSelect, onClose, dialogHeaderTitle } = props
	const [refused, setRefused] = useState<string | null>(null)

	function handlePick(asset: Asset) {
		const url = getFullSizeUrl(asset)
		// Sanity would only drop it after the dialog has closed, and without a word.
		const reason = whyRefused(asset, accept) ?? (url === null ? NO_FILE : null)
		setRefused(reason)
		if (reason !== null || url === null) return

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
				refused === null ? undefined : (
					<Card tone="caution" padding={3} role="alert">
						<Text size={1}>{refused}</Text>
					</Card>
				)
			}
		>
			{/* The dialog sizes to its content, and the picker needs a fixed height to scroll in.
			    Any click clears the refusal, so it never sits under another asset; Pick asset's
			    own handler runs after this one and sets it again. */}
			<Box style={{ height: '80vh' }} onClickCapture={() => setRefused(null)}>
				<RasterStudioPicker config={config} onPick={handlePick} />
			</Box>
		</Dialog>
	)
}
