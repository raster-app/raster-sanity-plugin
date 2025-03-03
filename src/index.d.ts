import { Plugin } from "sanity";

interface RasterConfig {
  apiKey: string;
  orgId: string;
}

export const rasterAssetSource: Plugin<RasterConfig>;
