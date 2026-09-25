import { useEffect, useRef, useState } from "react";
import {
  useAssetUpload,
  useRasterClient,
  type AssetsResource,
  type RasterNavigation,
  type UploadState,
} from "@raster/react";
import { toUserMessage, type AssetVariant } from "@raster/sdk";

/**
 * What the browser does to Raster rather than reads from it: uploading an asset or a variant,
 * and promoting a variant to be its asset's default. Both report through `busy`, `error` and
 * `notice`, which the banners and the detail pane read.
 */
export function useBrowserActions({
  nav,
  assets,
}: {
  nav: RasterNavigation;
  assets: AssetsResource;
}) {
  /** Context */
  const client = useRasterClient();

  /** Data */
  const upload = useAssetUpload();

  /** State and refs */
  const [busy, setBusy] = useState<"promote" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Which asset an upload should attach to as a variant, or null for a new top-level asset.
  const uploadParentRef = useRef<string | null>(null);
  // Read once an upload resolves, when the closure's `upload.state` is long out of date.
  const uploadStatusRef = useRef<UploadState["status"]>("idle");
  // Bumped per upload, so one that a newer upload replaced knows it is no longer current.
  const uploadRunRef = useRef(0);

  /** Derived */
  // The library an asset belongs to — a search hit's is not the one being browsed, and may be
  // the only library in play, since a search can start from the library list.
  const assetLibraryId = nav.asset?.libraryId ?? nav.library?.id ?? null;
  const canUpload = nav.organizationId !== null && assetLibraryId !== null;

  /** Handlers */
  function openFilePicker(parentId: string | null) {
    uploadParentRef.current = parentId;
    fileInputRef.current?.click();
  }

  async function uploadFile(file: File, parentId: string | null) {
    const organizationId = nav.organizationId;
    const libraryId = assetLibraryId;
    if (organizationId === null || libraryId === null) return;

    // A drop can be any file, and the file dialog's `accept` is only a hint.
    if (!file.type.startsWith("image/")) {
      setError(`${file.name} is not an image. Only images can be uploaded here.`);
      return;
    }

    const run = ++uploadRunRef.current;
    setError(null);
    setNotice(null);
    const finished = await upload.upload({ organizationId, libraryId, parentId, source: file });
    if (run !== uploadRunRef.current) return;

    if (finished === null) {
      // Null is also a failed upload, whose message is in `upload.state`. Only an upload still
      // processing when polling gave up is left in `processing`, and would stay there: it is
      // uploaded, so settle the banner and placeholder and say a refresh will find it.
      if (uploadStatusRef.current === "processing") {
        upload.reset();
        setNotice("Still processing. Refresh in a moment.");
      }
      return;
    }

    if (parentId === null) {
      // Listings lag behind processing by a few seconds, so show it now rather than reload
      // and appear to have lost it. A later reload overwrites this with the server's order.
      assets.setAssets((current) => [finished, ...current.filter((a) => a.id !== finished.id)]);
      return;
    }

    // A new variant reshapes the parent, so take the parent back from the server rather
    // than splice a guess into the list we are holding.
    try {
      const parent = await client.assets.get({ organizationId, libraryId, assetId: parentId });
      nav.openAsset(parent);
      assets.setAssets((current) => current.map((a) => (a.id === parent.id ? parent : a)));
    } catch (caught) {
      console.error(caught);
      setError(toUserMessage(caught));
    }
  }

  function uploadChosenFile(file: File) {
    void uploadFile(file, uploadParentRef.current);
  }

  async function promote(variant: AssetVariant) {
    const asset = nav.asset;
    const organizationId = nav.organizationId;
    const libraryId = assetLibraryId;
    if (asset === null || organizationId === null || libraryId === null) return;

    setBusy("promote");
    setError(null);
    setNotice(null);
    try {
      await client.assets.promote({
        organizationId,
        libraryId,
        assetId: asset.id,
        variantId: variant.id,
      });

      // The previous default becomes a variant and the promoted one's entry goes away, so
      // take the asset back from the server. Raster finishes the promote after the call
      // returns, so this can still be the old asset until the SDK's promote hook waits for it.
      const fresh = await client.assets.get({ organizationId, libraryId, assetId: asset.id });
      nav.openAsset(fresh);
      assets.setAssets((current) => current.map((a) => (a.id === fresh.id ? fresh : a)));
    } catch (caught) {
      console.error(caught);
      setError(toUserMessage(caught));
    } finally {
      setBusy(null);
    }
  }

  /** Effects */
  useEffect(() => {
    uploadStatusRef.current = upload.state.status;
  }, [upload.state.status]);

  return {
    uploadState: upload.state,
    busy,
    error,
    notice,
    clearNotice: () => setNotice(null),
    canUpload,
    fileInputRef,
    openFilePicker,
    uploadFile,
    uploadChosenFile,
    promote,
  };
}
