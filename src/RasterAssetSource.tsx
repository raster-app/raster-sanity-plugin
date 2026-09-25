import React, { Suspense, useCallback } from "react";
import { getFullSizeUrl } from "@raster/sdk";
import { Box, Dialog } from "@sanity/ui";
import { type AssetFromSource } from "sanity";
import { RasterBrowserFallback } from "./RasterFallback";
import { RasterStudioProvider } from "./RasterStudioProvider";
import { type RasterAssetSourceProps, type RasterItem } from "./types";

// Lazily loaded, as before: Studio extracts schemas in Node, and the browser's module graph
// reaches the DOM. The `catch` keeps a failed chunk from taking the whole form down with it.
const RasterBrowser = React.lazy(() =>
  import("./RasterBrowser")
    .then((module) => ({ default: module.RasterBrowser }))
    .catch((caught: unknown) => {
      console.error(caught);
      return { default: () => <RasterBrowserFallback label="Raster failed to load." /> };
    })
);

/**
 * The Raster picker, as an image field's asset source.
 *
 * What lands in the document is a URL for Sanity to fetch and store, plus provenance: the
 * Raster asset's id and its link in the app, under the asset document's `source`. That is
 * what lets an editor get from an image in a document back to the asset it came from.
 */
export function RasterAssetSource(props: RasterAssetSourceProps) {
  const { config, onSelect, onClose, dialogHeaderTitle } = props;

  const handlePick = useCallback(
    (item: RasterItem) => {
      // The asset's full-size image. A search hit has no `url` of its own, only renditions,
      // which is why this goes through the SDK rather than reading `item.url`.
      const url = getFullSizeUrl(item);
      if (url === null) return;

      const asset: AssetFromSource = {
        kind: "url",
        value: url,
        assetDocumentProps: {
          originalFilename: item.name ?? undefined,
          source: {
            name: "raster",
            // Always the asset, even for a variant, so a document can tell which asset it
            // holds; `url` still opens the exact variant that was picked.
            id: item.parentId ?? item.id,
            url: item.appUrl ?? undefined,
          },
          ...("description" in item && item.description != null && item.description !== ""
            ? { description: item.description }
            : {}),
          // `ImageAsset` describes a stored Sanity document; Studio only reads the handful of
          // fields above off this object and fills the rest itself once it has the file.
        } as AssetFromSource["assetDocumentProps"],
      };

      onSelect([asset]);
      onClose();
    },
    [onSelect, onClose]
  );

  return (
    <Dialog
      header={dialogHeaderTitle ?? "Select an image from Raster"}
      id="raster-asset-picker"
      onClose={onClose}
      width={4}
      position="fixed"
      zOffset={99999999}
      style={{ height: "96vh", marginTop: "40px" }}
    >
      <Box padding={4} style={{ height: "100%", minHeight: 0 }}>
        <RasterStudioProvider config={config}>
          <Suspense fallback={<RasterBrowserFallback />}>
            <RasterBrowser
              config={config}
              onPick={handlePick}
              pickLabel="Use this image"
              // No redirect sign-in here: leaving the page would unmount the document being
              // edited, unsaved changes and all. The device code works without navigating.
              allowRedirectSignIn={false}
            />
          </Suspense>
        </RasterStudioProvider>
      </Box>
    </Dialog>
  );
}
