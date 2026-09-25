import { ImageIcon } from "./icons";
import { definePlugin, type AssetSource, type Tool } from "sanity";
import { RasterAssetSource } from "./RasterAssetSource";
import { RasterTool } from "./RasterTool";
import { type RasterConfig } from "./types";

// eslint-disable-next-line react-refresh/only-export-components
export * from "./types";

/**
 * Raster in Sanity Studio: an asset source on every image field, and a tool for browsing
 * libraries on their own.
 *
 * Config is optional — with none, editors sign in to Raster from inside Studio and the
 * session is remembered per browser. An admin can instead save an API key for everyone in the
 * Raster tool. See `RasterConfig` for pinning an organization.
 */
export const rasterPlugin = definePlugin<RasterConfig | void>((config) => {
  const settings: RasterConfig = config ?? {};

  // 1.x took the key here, where it shipped in the Studio bundle. It is ignored now.
  if ("apiKey" in settings) {
    console.warn(
      "rasterPlugin: `apiKey` is no longer supported. Remove it, and save the key in the Raster tool instead."
    );
  }

  const rasterSource: AssetSource = {
    name: "raster",
    title: "Raster",
    component: (props) => <RasterAssetSource {...props} config={settings} />,
    icon: ImageIcon,
  };

  const rasterTool: Tool = {
    name: "raster",
    title: "Raster Assets",
    icon: ImageIcon,
    component: () => <RasterTool config={settings} />,
  };

  return {
    name: "raster-asset-source",
    form: {
      image: {
        assetSources: (prev) => [...prev, rasterSource],
      },
    },
    tools: (prev) => [...prev, rasterTool],
  };
});
