import type { AssetSourceComponentProps } from 'sanity'

export interface RasterConfig {
	/** Pin the plugin to one organization: a sign-in that grants any other fails. */
	orgId?: string
}

export interface RasterAssetSourceProps extends AssetSourceComponentProps {
	config: RasterConfig
}

export interface RasterToolProps {
	config: RasterConfig
}
