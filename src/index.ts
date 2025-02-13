import { definePlugin, type AssetSource } from "sanity";
import { RasterAssetSource } from "./RasterAssetSource";
import React from "react";

interface RasterConfig {
  apiKey: string;
  orgId: string;
}

export const rasterAssetSource = definePlugin<RasterConfig>((config) => {
  const rasterSource: AssetSource = {
    name: "raster",
    title: "Raster",
    component: (props) =>
      React.createElement(RasterAssetSource, { ...props, config }),
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
