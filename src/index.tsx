import { definePlugin, type AssetSource } from "sanity";
import { RasterAssetSourceWrapper } from "./RasterAssetSourceWrapper";
import { RasterConfig } from "./types";

export * from "./types";

export const rasterAssetSource = definePlugin<RasterConfig>((config) => {
  const rasterSource: AssetSource = {
    name: "raster",
    title: "Raster",
    component: (props) => (
      <RasterAssetSourceWrapper {...props} config={config} />
    ),
    icon: () => null,
  };

  return {
    name: "raster-asset-source",
    form: {
      image: {
        assetSources: (prev) => [...prev, rasterSource],
      },
    },
  };
});
