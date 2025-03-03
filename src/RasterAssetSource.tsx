import { Box, Button, Card, Dialog, Text } from "@sanity/ui";
import {
  RasterImages,
  RasterLibraries,
  RasterPreview,
  useSelectedImages,
} from "@raster-app/raster-toolkit";
import React from "react";
import { type RasterAssetSourceProps } from "./types";
import { pickerStyles } from "./styles";

export function RasterAssetSource(props: RasterAssetSourceProps) {
  const { onSelect, config } = props;
  const { count, images: selectedPhotos } = useSelectedImages();

  const handleConfirm = React.useCallback(() => {
    if (!selectedPhotos) return;

    const assets = selectedPhotos.map((image) => ({
      kind: "url" as const,
      value: image.url,
    }));

    onSelect(assets);
    props.onClose();
  }, [onSelect, selectedPhotos, props]);

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
        <div style={pickerStyles.content}>
          <RasterLibraries config={config} />
          <div style={pickerStyles.previewContainer}>
            <RasterPreview
              config={config}
              initialValue={null}
              showBorder={false}
            />
            <hr style={pickerStyles.divider} />
            <RasterImages config={config} isSingleImage />
          </div>
        </div>

        <Box style={pickerStyles.footer}>
          <Button mode="ghost" onClick={props.onClose} text="Cancel" />
          {count > 0 && (
            <Button
              tone="positive"
              onClick={handleConfirm}
              text={`Confirm (${count})`}
            />
          )}
        </Box>
      </Box>
    </Dialog>
  );
}
