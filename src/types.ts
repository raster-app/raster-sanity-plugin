import { type Asset, type AssetVariant } from "@raster/sdk";
import { type AssetSourceComponentProps, type Tool } from "sanity";

/**
 * Plugin configuration. Every field is optional: with no config at all, editors sign in to
 * Raster themselves from inside Studio and the plugin remembers the session per browser.
 */
export interface RasterConfig {
  /**
   * Pin the plugin to one organization. The organization switcher is then hidden, and a
   * credential that cannot reach this organization reports that rather than quietly
   * browsing another one.
   */
  organizationId?: string;

  /** @deprecated Renamed to `organizationId`, which is what the Raster API calls it. */
  orgId?: string;

  /**
   * The name Raster's consent page shows and Connected apps lists. Defaults to `"Sanity"`.
   * It names the host, so "Raster for Sanity" would read, on a page reached from Raster, as
   * connecting Raster to itself.
   */
  hostName?: string;

  /**
   * Offer the redirect sign-in (authorization code + PKCE) in the Raster tool, alongside the
   * device grant. Defaults to true. The asset-source dialog never offers it: a redirect
   * would unmount the document being edited.
   */
  allowRedirectSignIn?: boolean;

  /** Hide the "use an API key instead" path from the sign-in screen. Defaults to false. */
  hideApiKeySignIn?: boolean;
}

/**
 * Anything the browser shows in a tile: a top-level asset, or one of its variants. Both
 * satisfy the SDK's `DisplayAsset`, which is what lets one tile component draw either.
 */
export type RasterItem = Asset | AssetVariant;

/**
 * Whether an image field can take this asset. Libraries also hold video and PDF, which
 * Sanity would fail to store as an image. Variants carry no type, so ask of the asset.
 */
export function isImage(asset: Asset): boolean {
  return asset.contentType?.startsWith("image/") === true;
}

export interface RasterAssetSourceProps extends AssetSourceComponentProps {
  config: RasterConfig;
}

export interface RasterToolProps {
  config: RasterConfig;
  /** Passed by Studio when it renders the tool. Unused, and optional so tests can omit it. */
  tool?: Tool;
}

/**
 * @deprecated Kept so existing imports keep compiling. The plugin now works with the
 * `Asset` and `DisplayAsset` types from `@raster/sdk`.
 */
export interface RasterImage {
  url: string;
  filename: string;
  size?: number;
  width?: number;
  height?: number;
  mimeType?: string;
}
