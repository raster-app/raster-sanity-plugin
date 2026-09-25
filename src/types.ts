import { type Asset, type AssetVariant } from "@raster/sdk";
import { type AssetSourceComponentProps, type Tool } from "sanity";

/** Plugin configuration. Every field is optional. */
export interface RasterConfig {
  /** Pin the plugin to one organization and hide the switcher. */
  organizationId?: string;

  /** @deprecated Use `organizationId`. */
  orgId?: string;

  /** The name Raster's consent page and Connected apps show. Defaults to `"Sanity"`. */
  hostName?: string;

  /** Hide the "use an API key instead" path from the sign-in screen. Defaults to false. */
  hideApiKeySignIn?: boolean;
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
  /** Passed by Studio. Unused. */
  tool?: Tool;
}

/** @deprecated Use `Asset` from `@raster/sdk`. */
export interface RasterImage {
  url: string;
  filename: string;
  size?: number;
  width?: number;
  height?: number;
  mimeType?: string;
}
