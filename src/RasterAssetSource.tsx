import { Box, Button, Card, Dialog, Stack, Text } from "@sanity/ui";
import { ImageIcon } from "@sanity/icons";
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
  const [showPicker, setShowPicker] = React.useState(false);
  const { count, images: selectedPhotos } = useSelectedImages();

  const handleConfirm = React.useCallback(() => {
    if (!selectedPhotos) return;

    const assets = selectedPhotos.map((image) => ({
      kind: "url" as const,
      value: image.url,
    }));

    onSelect(assets);
    setShowPicker(false);
  }, [onSelect, selectedPhotos]);

  if (!config.apiKey || !config.orgId) {
    return (
      <Card padding={4} tone="critical">
        <Text>Please configure the Raster plugin with apiKey and orgId</Text>
      </Card>
    );
  }

  return (
    <>
      <Card padding={4}>
        <Stack space={4}>
          <Text size={2} weight="semibold">
            Select from Raster
          </Text>
          <Box>
            <Button
              icon={ImageIcon}
              mode="ghost"
              onClick={() => setShowPicker(true)}
              text="Browse Raster Assets"
            />
          </Box>
        </Stack>
      </Card>

      {showPicker && (
        <Dialog
          header="Select images from Raster"
          id="raster-asset-picker"
          onClose={() => setShowPicker(false)}
          width={4}
          position="fixed"
          style={{ height: "90vh" }}
        >
          <Box padding={4} style={{ height: "100%" }}>
            <div style={pickerStyles.content}>
              <RasterLibraries config={config} />
              <div style={pickerStyles.previewContainer}>
                <RasterPreview config={config} initialValue={null} />
                <hr style={pickerStyles.divider} />
                <RasterImages config={config} />
              </div>
            </div>

            <Box style={pickerStyles.footer}>
              <Button
                mode="ghost"
                onClick={() => setShowPicker(false)}
                text="Cancel"
              />
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
      )}
    </>
  );
}
