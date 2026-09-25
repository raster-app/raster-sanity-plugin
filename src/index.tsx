import { definePlugin, type AssetSource, type Tool } from "sanity";
import { icons } from "@sanity/icons";
import { RasterAssetSource } from "./raster-asset-source";
import { RasterTool } from "./raster-tool";
import { type RasterConfig } from "./types";

// eslint-disable-next-line react-refresh/only-export-components
export * from "./types";

/** Adds Raster as an asset source on every image field, and a Raster tool. */
export const rasterPlugin = definePlugin<RasterConfig | void>((config) => {
  const settings: RasterConfig = config ?? {};

  // A 1.x config may still pass it.
  if ("apiKey" in settings) {
    console.warn(
      "rasterPlugin: `apiKey` is no longer supported. Remove it, and save the key in the Raster tool instead."
    );
  }

  const rasterSource: AssetSource = {
    name: "raster",
    title: "Raster",
    component: (props) => <RasterAssetSource {...props} config={settings} />,
    icon: icons.image,
  };

  const rasterTool: Tool = {
    name: "raster",
    title: "Raster Assets",
    icon: icons.image,
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
