import { definePlugin, type AssetSource } from "sanity";
import { RasterAssetSource } from "./RasterAssetSource";
import { RasterConfig } from "./types";
import React from "react";

export * from "./types";

export const rasterAssetSource = definePlugin<RasterConfig>((config) => {
  const rasterSource: AssetSource = {
    name: "raster",
    title: "Raster",
    component: (props) => <RasterAssetSource {...props} config={config} />,
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
