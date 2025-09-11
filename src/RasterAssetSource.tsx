import { Box, Card, Dialog, Text } from "@sanity/ui";
import React, { Suspense } from "react";
import { type RasterAssetSourceProps } from "./types";

// Lazy wrapper component to avoid Node.js issues during schema extraction
const RasterPickerContent = React.lazy(() =>
  import("./RasterPickerContent").catch(() => ({
    default: () => <div>Loading...</div>,
  }))
);

export function RasterAssetSource(props: RasterAssetSourceProps) {
  const { config } = props;

  if (!config.apiKey || !config.orgId) {
    return (
      <Card padding={4} tone="critical">
        <Text>Please configure the Raster plugin with apiKey and orgId</Text>
      </Card>
    );
  }

  return (
    <Dialog
      header="Select images from Raster"
      id="raster-asset-picker"
      onClose={props.onClose}
      width={4}
      position="fixed"
      zOffset={99999999}
      style={{ height: "96vh", marginTop: "40px" }}
    >
      <Box padding={4} style={{ height: "100%" }}>
        <Suspense fallback={<div>Loading Raster components...</div>}>
          <RasterPickerContent {...props} />
        </Suspense>
      </Box>
    </Dialog>
  );
}
