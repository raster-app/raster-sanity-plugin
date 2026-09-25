import { useState } from "react";
import { type Asset, type AssetVariant, type UploadState } from "@raster/react";
import { Box, Flex, Text } from "@sanity/ui";
import { AssetDetail } from "./AssetDetail";
import { AssetGrid } from "./asset-grid";
import { isImage, type RasterItem } from "./types";

/**
 * Whether this is the optimistic placeholder for a variant Raster has not finished making.
 * The flag is client-only and lives on `AssetVariant`, so it has to be narrowed to rather
 * than read off the union.
 */
function isProcessing(item: RasterItem): boolean {
  return "processing" in item && item.processing === true;
}

/** The asset's default first, then its variants, then a placeholder for one being made. */
function variantItems(asset: Asset, uploadState: UploadState): Array<RasterItem> {
  const items: Array<RasterItem> = [asset, ...(asset.variants ?? [])];

  if (uploadState.status === "processing" && uploadState.asset.parentId === asset.id) {
    const pending = uploadState.asset;
    // `processing` is the SDK's flag for exactly this: a tile that should be visible and
    // shaped like an asset, but not selectable until Raster has produced the image.
    items.push({
      id: pending.id,
      parentId: pending.parentId,
      name: pending.name,
      url: pending.url,
      sizes: null,
      width: null,
      height: null,
      appUrl: pending.appUrl,
      processing: true,
    });
  }
  return items;
}

export type VariantViewProps = {
  asset: Asset;
  /** The upload in flight, shown as a placeholder tile when it is a variant of `asset`. */
  uploadState: UploadState;
  busy: string | null;
  onPromote: (variant: AssetVariant) => void;
  onPick?: (item: RasterItem) => void;
  pickLabel: string;
  onUploadVariant?: () => void;
};

/** One asset's default and variants, and the detail pane for whichever is selected. */
export function VariantView({
  asset,
  uploadState,
  busy,
  onPromote,
  onPick,
  pickLabel,
  onUploadVariant,
}: VariantViewProps) {
  /** State */
  const [selectedId, setSelectedId] = useState<string | null>(null);

  /** Derived */
  const items = variantItems(asset, uploadState);
  // Nothing chosen yet, or a choice a promote or another asset took away: the default, so the
  // detail pane is never empty and the default is what an editor sees first.
  const selected = items.find((item) => item.id === selectedId) ?? asset;

  return (
    // Variants beside the detail pane, which wraps below them when the pane is too narrow.
    <Flex gap={4} wrap="wrap" align="flex-start">
      <Flex direction="column" gap={3} flex={1} style={{ minWidth: 280 }}>
        <Text size={1} muted>
          {items.length === 1
            ? "This asset has no variants yet."
            : `The default, and ${items.length - 1} ${items.length === 2 ? "variant" : "variants"}.`}
        </Text>
        <AssetGrid
          assets={items}
          onSelect={(item) => setSelectedId(item.id)}
          defaultAssetId={asset.id}
          emptyMessage="Nothing to show."
        />
      </Flex>
      <Box style={{ flex: "0 1 280px" }}>
        <AssetDetail
        item={selected}
        canPromote={selected.id !== asset.id && !isProcessing(selected)}
        onPromote={() => onPromote(selected as AssetVariant)}
        onPick={onPick}
        pickLabel={pickLabel}
        canPick={isImage(asset)}
        onUploadVariant={onUploadVariant}
        busy={busy}
        />
      </Box>
    </Flex>
  );
}
