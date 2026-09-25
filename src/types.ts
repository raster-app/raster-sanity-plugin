import { type Asset, type AssetVariant } from "@raster/sdk";
import { type AssetSourceComponentProps } from "sanity";

export interface RasterConfig {
  /** Pin the plugin to one organization and hide the switcher. */
  orgId?: string;
}

/** A top-level asset or one of its variants. */
export type RasterItem = Asset | AssetVariant;

/** Libraries also hold video and PDF. Variants carry no type, so pass their asset. */
export function isImage(asset: Asset): boolean {
  return asset.contentType?.startsWith("image/") === true;
}

export interface RasterAssetSourceProps extends AssetSourceComponentProps {
  config: RasterConfig;
}

export interface RasterToolProps {
  config: RasterConfig;
}
