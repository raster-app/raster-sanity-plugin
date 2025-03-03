import { Box, Card, Text } from "@sanity/ui";
import {
  RasterImages,
  RasterLibraries,
  RasterPreview,
} from "@raster-app/raster-toolkit";
import { type RasterToolProps } from "./types";
import { pickerStyles } from "./styles";

export function RasterTool(props: RasterToolProps) {
  const { config } = props;

  if (!config.apiKey || !config.orgId) {
    return (
      <Card padding={4} tone="critical">
        <Text>Please configure the Raster plugin with apiKey and orgId</Text>
      </Card>
    );
  }

  return (
    <Box padding={4} style={{ height: "100%" }}>
      <div style={pickerStyles.content}>
        <RasterLibraries config={config} />
        <div style={pickerStyles.previewContainer}>
          <RasterPreview config={config} initialValue={null} />
          <hr style={pickerStyles.divider} />
          <RasterImages config={config} />
        </div>
      </div>
    </Box>
  );
}
