import { useState } from 'react'
import { getFullSizeUrl, type Asset } from '@raster-app/react'
import { Box, Card, Flex, Text } from '@sanity/ui'
import { RasterStudioPicker } from './raster-studio-picker'
import type { RasterToolProps } from './types'

/**
 * Raster as a Studio tool: the same picker, with the whole pane to work in, and where an admin
 * saves the studio's API key. There is no field to fill here, so picking copies the asset's URL.
 */
export function RasterTool({ config }: RasterToolProps) {
	const [copy, setCopy] = useState<{ url: string; copied: boolean } | null>(null)

	async function copyUrl(asset: Asset) {
		const url = getFullSizeUrl(asset)
		if (url === null) return
		try {
			await navigator.clipboard.writeText(url)
			setCopy({ url, copied: true })
		} catch (caught) {
			console.error(caught)
			setCopy({ url, copied: false })
		}
	}

	return (
		<Flex direction="column" style={{ height: '100%', minHeight: 0 }}>
			{copy !== null && (
				<Card tone={copy.copied ? 'positive' : 'critical'} padding={3} role="status">
					<Text size={1} style={{ overflowWrap: 'anywhere' }}>
						{copy.copied ? 'Copied the asset URL:' : 'Could not copy the asset URL:'} {copy.url}
					</Text>
				</Card>
			)}
			<Box flex={1} style={{ minHeight: 0 }}>
				<RasterStudioPicker config={config} onPick={copyUrl} allowStudioKeySetup />
			</Box>
		</Flex>
	)
}
