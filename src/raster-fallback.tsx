import { Flex, Text } from '@sanity/ui'

/** Shown while the browser loads. In its own module so the browser stays a separate chunk. */
export function RasterBrowserFallback({ label }: { label?: string }) {
	return (
		<Flex align="center" justify="center" padding={5}>
			<Text size={1} muted>
				{label ?? 'Loading Raster…'}
			</Text>
		</Flex>
	)
}
