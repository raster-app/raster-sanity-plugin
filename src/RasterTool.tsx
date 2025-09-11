import { Box, Card, Text } from "@sanity/ui";
import React, { Suspense } from "react";
import { type RasterToolProps } from "./types";

// Lazy wrapper component to avoid Node.js issues during schema extraction
const RasterToolContent = React.lazy(() =>
  import("./RasterToolContent").catch(() => ({
    default: () => <div>Loading...</div>,
  }))
);

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
      <Suspense fallback={<div>Loading Raster components...</div>}>
        <RasterToolContent {...props} />
      </Suspense>
    </Box>
  );
}
