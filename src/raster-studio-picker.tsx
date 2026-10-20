import { useInsertionEffect } from 'react'
import { RasterPicker, useSession, type Asset } from '@raster-app/react'
import styles from '@raster-app/react/styles.css?inline'
import { Box, Flex } from '@sanity/ui'
import { useColorSchemeValue } from 'sanity'
import { RasterStudioProvider } from './raster-studio-provider'
import { StudioKeySetup } from './studio-key-setup'
import type { RasterConfig } from './types'
import { useStudioKey } from './use-studio-key'

const STYLE_ELEMENT_ID = 'raster-sanity-plugin-styles'

/**
 * A Studio cannot be asked to import a plugin's CSS file, so the picker's stylesheet is inlined
 * at build time and put into the document here, once. Never removed: the asset source and the
 * tool can both be open, and they share the one element.
 */
function useRasterStyles(): void {
	useInsertionEffect(() => {
		if (document.getElementById(STYLE_ELEMENT_ID) !== null) return
		const style = document.createElement('style')
		style.id = STYLE_ELEMENT_ID
		style.textContent = styles
		document.head.append(style)
	}, [])
}

/** Raster's picker in the Studio's color scheme, signed in with the workspace's client. */
export function RasterStudioPicker({
	config,
	onPick,
	allowStudioKeySetup = false,
}: {
	config: RasterConfig
	/** Without it, the picker only browses. */
	onPick?: (asset: Asset) => void
	/** Let an admin save an API key for the studio. The tool only. */
	allowStudioKeySetup?: boolean
}) {
	useRasterStyles()

	return (
		<RasterStudioProvider config={config}>
			<StudioPicker config={config} onPick={onPick} allowStudioKeySetup={allowStudioKeySetup} />
		</RasterStudioProvider>
	)
}

/** Connects with the key saved for the studio, and lets an admin save one while signed out. */
function StudioPicker({
	config,
	onPick,
	allowStudioKeySetup,
}: {
	config: RasterConfig
	onPick?: (asset: Asset) => void
	allowStudioKeySetup: boolean
}) {
	/** Context */
	const scheme = useColorSchemeValue()
	const studioKey = useStudioKey()
	const { credentials, isConfigured } = useSession()

	/** Derived */
	const isSignedOut = credentials !== undefined && !isConfigured

	return (
		<Flex direction="column" gap={3} style={{ height: '100%', minHeight: 0 }}>
			{isSignedOut && allowStudioKeySetup && <StudioKeySetup orgId={config.orgId} />}

			<Box flex={1} style={{ minHeight: 0 }}>
				<RasterPicker
					organizationId={config.orgId}
					apiKey={studioKey.key ?? undefined}
					onPick={onPick}
					onError={console.error}
					theme={scheme}
				/>
			</Box>
		</Flex>
	)
}
