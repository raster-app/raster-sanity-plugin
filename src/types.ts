import type { Asset } from '@raster-app/react'
import type { AssetSourceComponentProps } from 'sanity'

export interface RasterConfig {
	/** Pin the plugin to one organization: a sign-in that grants any other fails. */
	orgId?: string
}

/**
 * Libraries also hold video and PDF, which an image field cannot take. Some variant rows carry no
 * type of their own; those pass, since a variant shares its original's kind.
 */
export function isImage(asset: Asset): boolean {
	if (asset.contentType === null) return asset.parentId !== null
	return asset.contentType.startsWith('image/')
}

export interface RasterAssetSourceProps extends AssetSourceComponentProps {
	config: RasterConfig
}

export interface RasterToolProps {
	config: RasterConfig
}
