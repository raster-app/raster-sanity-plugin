import { type AssetSourceComponentProps } from "sanity";

export interface RasterConfig {
  apiKey: string;
  orgId: string;
}

export interface RasterAssetSourceProps extends AssetSourceComponentProps {
  config: RasterConfig;
}

export interface RasterToolProps {
  config: RasterConfig;
}

export interface RasterImage {
  url: string;
  filename: string;
  size?: number;
  width?: number;
  height?: number;
  mimeType?: string;
}
