import {
  RasterImages,
  RasterLibraries,
  RasterPreview,
} from "@raster-app/raster-toolkit";
import { type RasterToolProps } from "./types";
import { pickerStyles } from "./styles";

export default function RasterToolContent(props: RasterToolProps) {
  const { config } = props;

  return (
    <div style={pickerStyles.content}>
      <RasterLibraries config={config} />
      <div style={pickerStyles.previewContainer}>
        <RasterPreview config={config} initialValue={null} />
        <hr style={pickerStyles.divider} />
        <RasterImages config={config} />
      </div>
    </div>
  );
}
