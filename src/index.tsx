import { definePlugin, type AssetSource, type Tool } from "sanity";
import { RasterAssetSource } from "./RasterAssetSource";
import { RasterConfig } from "./types";
import { ImageIcon } from "@sanity/icons";
import { RasterTool } from "./RasterTool";

// eslint-disable-next-line react-refresh/only-export-components
export * from "./types";

export const rasterAssetSource = definePlugin<RasterConfig>((config) => {
  const rasterSource: AssetSource = {
    name: "raster",
    title: "Raster",
    component: (props) => <RasterAssetSource {...props} config={config} />,
    icon: ImageIcon,
  };

  const rasterTool: Tool = {
    name: "raster",
    title: "Raster Assets",
    icon: ImageIcon,
    component: (props) => <RasterTool {...props} config={config} />,
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
