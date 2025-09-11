import { Box, Button } from "@sanity/ui";
import {
  RasterImages,
  RasterLibraries,
  RasterPreview,
  useSelectedImages,
} from "@raster-app/raster-toolkit";
import React from "react";
import { type RasterAssetSourceProps } from "./types";
import { pickerStyles } from "./styles";

export default function RasterPickerContent(props: RasterAssetSourceProps) {
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

  return (
    <>
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
    </>
  );
}
