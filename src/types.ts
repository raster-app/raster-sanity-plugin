import type { Asset } from '@raster-app/react'
import type { AssetSourceComponentProps } from 'sanity'

export interface RasterConfig {
	/** Pin the plugin to one organization: a sign-in that grants any other fails. */
	orgId?: string
}

/** Libraries also hold video and PDF, which an image field cannot take. */
export function isImage(asset: Asset): boolean {
	return asset.contentType?.startsWith('image/') === true
}

export interface RasterAssetSourceProps extends AssetSourceComponentProps {
	config: RasterConfig
}

export interface RasterToolProps {
	config: RasterConfig
}
