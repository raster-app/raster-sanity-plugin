import { useInsertionEffect } from 'react'
import { RasterPicker, type Asset } from '@raster-app/react'
import styles from '@raster-app/react/styles.css?inline'
import { useColorSchemeValue } from 'sanity'
import { RasterSignInGate } from './raster-sign-in-gate'
import { RasterStudioProvider } from './raster-studio-provider'
import type { RasterConfig } from './types'

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
	allowStudioKeySetup,
}: {
	config: RasterConfig
	onPick: (asset: Asset) => void
	/** Let an admin save an API key for the studio. The tool only. */
	allowStudioKeySetup?: boolean
}) {
	useRasterStyles()
	const scheme = useColorSchemeValue()

	return (
		<RasterStudioProvider config={config}>
			<RasterSignInGate allowStudioKeySetup={allowStudioKeySetup}>
				<RasterPicker
					organizationId={config.orgId}
					onPick={onPick}
					onError={console.error}
					theme={scheme}
				/>
			</RasterSignInGate>
		</RasterStudioProvider>
	)
}
