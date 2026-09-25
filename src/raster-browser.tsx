import { useMemo, useState, type DragEvent } from "react";
import {
  useAssetSearch,
  useAssets,
  useLibraries,
  useOrganizations,
  useRasterNavigation,
  useSession,
} from "@raster/react";
import { type Asset } from "@raster/sdk";
import { Box, Button, Card, Flex, Text } from "@sanity/ui";
import { icons } from "@sanity/icons";
import { AssetGrid } from "./asset-grid";
import { BrowserHeader } from "./browser-header";
import { LibraryList } from "./library-list";
import { LoadingState } from "./loading-state";
import { RasterSignInGate } from "./raster-sign-in-gate";
import { isImage, type RasterConfig, type RasterItem } from "./types";
import { useBrowserActions } from "./use-browser-actions";
import { VariantView } from "./variant-view";

export type RasterBrowserProps = {
  config: RasterConfig;
  /**
   * Called when the editor settles on an image. Present in the asset-source dialog; absent in
   * the tool, which browses rather than selects — the SDK deliberately leaves this to the
   * host instead of modelling "picking" as a capability.
   */
  onPick?: (item: RasterItem) => void;
  pickLabel?: string;
  /** Let an admin save an API key for the studio. True in the tool only. */
  allowStudioKeySetup?: boolean;
};

export function RasterBrowser({
  config,
  onPick,
  pickLabel = "Use this image",
  allowStudioKeySetup = false,
}: RasterBrowserProps) {
  return (
    // The picker dialog and the tool pane both hand down a fixed height; the grid scrolls inside
    // it rather than growing the page.
    <Flex direction="column" gap={3} style={{ height: "100%", minHeight: 0 }}>
      <RasterSignInGate allowStudioKeySetup={allowStudioKeySetup}>
        <Browser config={config} onPick={onPick} pickLabel={pickLabel} />
      </RasterSignInGate>
    </Flex>
  );
}

/** The organization → library → asset browser, shared by the tool and the picker. */
function Browser({
  config,
  onPick,
  pickLabel,
}: {
  config: RasterConfig;
  onPick?: (item: RasterItem) => void;
  pickLabel: string;
}) {
  /** Context */
  const { signOut } = useSession();

  /** Data */
  const allOrganizations = useOrganizations();
  const pinned = config.orgId ?? null;

  // A configured organization pins the plugin to it, so there is nothing to switch to.
  const organizations = useMemo(() => {
    if (allOrganizations.data === null) return null;
    if (pinned === null) return allOrganizations.data;
    return allOrganizations.data.filter((organization) => organization.id === pinned);
  }, [allOrganizations.data, pinned]);

  const nav = useRasterNavigation({ organizations });
  const organization = organizations?.find((item) => item.id === nav.organizationId) ?? null;

  const libraries = useLibraries({
    organizationId: nav.organizationId,
    organizationName: organization?.name ?? null,
  });

  const assets = useAssets({
    organizationId: nav.organizationId,
    libraryId: nav.library?.id ?? null,
  });

  // Inside a library, search that library; from the library list, the whole organization. The
  // asset view switches search off — it is showing one asset's variants, and a query there
  // would be answering a question nobody asked.
  const search = useAssetSearch(
    nav.organizationId === null || nav.asset !== null
      ? null
      : { organizationId: nav.organizationId, libraryId: nav.library?.id ?? null },
    nav.query,
    nav.refreshNonce
  );

  const actions = useBrowserActions({ nav, assets });

  /** State */
  const [isDropping, setIsDropping] = useState(false);

  /** Derived */
  const pinnedMissing =
    pinned !== null && allOrganizations.data !== null && (organizations?.length ?? 0) === 0;

  /** Handlers */
  function refresh() {
    nav.refresh();
    allOrganizations.reload();
    libraries.reload();
    assets.reload();
    actions.clearNotice();
  }

  function libraryName(libraryId: string | null | undefined) {
    return libraries.data?.find((library) => library.id === libraryId)?.name ?? null;
  }

  function handleTile(item: RasterItem) {
    // The tool browses everything; the picker fills an image field, so a video or PDF is a
    // tile it ignores rather than one that fails in Sanity after the dialog has closed.
    if (onPick !== undefined && !isImage(item as Asset)) return;

    // In the picker, an asset with no variants is one click: there is nothing to choose
    // between, and making an editor open it first would be ceremony.
    const hasVariants = "variants" in item && (item.variants?.length ?? 0) > 0;
    if (onPick !== undefined && !hasVariants) {
      // Mid-promote, the asset's URL may still serve the previous default.
      if (actions.busy !== "promote") onPick(item);
      return;
    }
    nav.openAsset(item as Asset);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDropping(false);
    const file = event.dataTransfer?.files?.[0];
    if (file === undefined || !actions.canUpload) return;
    void actions.uploadFile(file, nav.asset?.id ?? null);
  }

  /** Early returns */
  if (pinnedMissing) {
    return (
      <Flex direction="column" align="flex-start" gap={4} padding={4}>
        <Card tone="critical" padding={3} radius={2} border>
          <Text size={1}>
            This Raster account can't reach the organization <code>{pinned}</code> that this
            studio is configured for.
          </Text>
        </Card>
        <Button mode="ghost" fontSize={1} icon={icons.leave} text="Sign out" onClick={() => void signOut()} />
      </Flex>
    );
  }

  // `isRestored` is false until the remembered organization and library have been read back.
  // Rendering the library list first and then jumping into a library is worse than waiting.
  if (organizations === null || !nav.isRestored) {
    return <LoadingState label="Loading your Raster libraries…" />;
  }

  /** Render-only values */
  const { uploadState } = actions;
  const errorMessage = actions.error ?? (uploadState.status === "error" ? uploadState.message : null);
  const progress =
    uploadState.status === "uploading"
      ? "Uploading to Raster…"
      : uploadState.status === "processing"
        ? `Raster is processing ${uploadState.asset.name ?? "the upload"}. It will appear in a moment.`
        : actions.notice;

  return (
    <>
      <BrowserHeader
        nav={nav}
        organizations={organizations}
        organization={organization}
        search={search}
        onUpload={actions.canUpload ? () => actions.openFilePicker(nav.asset?.id ?? null) : undefined}
        isUploading={uploadState.status === "uploading"}
        onRefresh={refresh}
      />

      {errorMessage !== null && (
        <Card tone="critical" padding={3} radius={2} border>
          <Text size={1}>{errorMessage}</Text>
        </Card>
      )}

      {progress !== null && (
        <Card tone="primary" padding={3} radius={2} border>
          <Text size={1}>{progress}</Text>
        </Card>
      )}

      <Box
        flex={1}
        overflow="auto"
        // `minHeight: 0` is what lets this shrink below its content and scroll. The padding
        // leaves room for the focus ring on the last row of tiles.
        style={{ position: "relative", minHeight: 0, padding: 2 }}
        onDragOver={(event) => {
          if (!actions.canUpload) return;
          event.preventDefault();
          setIsDropping(true);
        }}
        onDragLeave={(event) => {
          // `dragleave` bubbles from every child the pointer crosses, so leaving a tile for
          // the tile beside it would flicker the overlay off and on. Only a pointer that has
          // actually left this element counts.
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
          setIsDropping(false);
        }}
        onDrop={handleDrop}
      >
        {isDropping && (
          // Covers the scroll area, so the whole grid reads as one target.
          <Card
            tone="primary"
            radius={3}
            border
            style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none" }}
          >
            <Flex align="center" justify="center" height="fill">
              <Text size={2}>
                {nav.asset === null
                  ? `Drop to upload to ${nav.library?.name ?? "this library"}`
                  : `Drop to add a variant of ${nav.asset.name ?? "this asset"}`}
              </Text>
            </Flex>
          </Card>
        )}

        {search.active ? (
          <AssetGrid
            assets={search.hits}
            isLoading={search.isSearching}
            error={search.error}
            hasMore={search.hasMore}
            onLoadMore={search.loadMore}
            onSelect={(item) => handleTile(item as RasterItem)}
            // A search from the library list spans every library, so a hit's own library is
            // the one thing a thumbnail cannot say.
            badgeFor={
              nav.library === null
                ? (item) => libraryName((item as Asset).libraryId)
                : undefined
            }
            emptyMessage={`Nothing in ${organization?.name ?? "Raster"} matches “${search.query}”.`}
          />
        ) : nav.library === null ? (
          <LibraryList
            libraries={libraries.data}
            error={libraries.error}
            onOpen={nav.openLibrary}
            emptyMessage="No libraries in this organization yet."
          />
        ) : nav.asset !== null ? (
          <VariantView
            asset={nav.asset}
            uploadState={uploadState}
            busy={actions.busy}
            onPromote={(variant) => void actions.promote(variant)}
            onPick={onPick}
            pickLabel={pickLabel}
            onUploadVariant={
              actions.canUpload ? () => actions.openFilePicker(nav.asset?.id ?? null) : undefined
            }
          />
        ) : (
          <AssetGrid
            assets={assets.assets}
            isLoading={assets.isLoading}
            error={assets.error}
            hasMore={assets.hasMore}
            onLoadMore={assets.loadMore}
            onSelect={(item) => handleTile(item as RasterItem)}
            emptyMessage={
              actions.canUpload
                ? "This library is empty. Drop an image here to upload it."
                : "Nothing here yet."
            }
          />
        )}
      </Box>

      <input
        ref={actions.fileInputRef}
        style={{ display: "none" }}
        type="file"
        accept="image/*"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          // Cleared so choosing the same file twice in a row still fires a change event.
          event.currentTarget.value = "";
          if (file !== undefined) actions.uploadChosenFile(file);
        }}
      />
    </>
  );
}
