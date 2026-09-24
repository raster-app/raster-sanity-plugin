import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import {
  useAssetSearch,
  useAssetUpload,
  useAssets,
  useLibraries,
  useOrganizations,
  useRasterClient,
  useRasterNavigation,
  useSession,
} from "@raster/react";
import { toUserMessage, type Asset, type AssetVariant } from "@raster/sdk";
import {
  AssetGrid,
  Breadcrumb,
  LibraryList,
  LoadingScreen,
  OrganizationMenu,
  SearchBar,
  type Crumb,
} from "@raster/ui";
import { LeaveIcon, RefreshIcon, UploadIcon } from "./icons";
import { Button, Card, Text } from "@sanity/ui";
import { AssetDetail } from "./AssetDetail";
import { pinnedOrganizationId } from "./client";
import { RasterSignInGate } from "./RasterSignInGate";
import { type RasterConfig, type RasterItem } from "./types";

/**
 * Whether this is the optimistic placeholder for a variant Raster has not finished making.
 * The flag is client-only and lives on `AssetVariant`, so it has to be narrowed to rather
 * than read off the union.
 */
function isProcessing(item: RasterItem): boolean {
  return "processing" in item && item.processing === true;
}

export type RasterBrowserProps = {
  config: RasterConfig;
  /**
   * Called when the editor settles on an image. Present in the asset-source dialog; absent in
   * the tool, which browses rather than selects — the SDK deliberately leaves this to the
   * host instead of modelling "picking" as a capability.
   */
  onPick?: (item: RasterItem) => void;
  pickLabel?: string;
  /** Offer the redirect sign-in. False in the dialog, where a redirect loses the document. */
  allowRedirectSignIn?: boolean;
};

export function RasterBrowser({
  config,
  onPick,
  pickLabel = "Use this image",
  allowRedirectSignIn = false,
}: RasterBrowserProps) {
  return (
    <div className="rstr-sanity-browser">
      <RasterSignInGate config={config} allowRedirectSignIn={allowRedirectSignIn}>
        <Browser config={config} onPick={onPick} pickLabel={pickLabel} />
      </RasterSignInGate>
    </div>
  );
}

/**
 * The organization → library → asset browser, shared by the tool and the picker.
 *
 * Every piece of behaviour here comes from `@raster/react`: paging, the abort-on-supersede
 * fetches, the debounced search, the remembered organization and library. What is left is the
 * Studio-shaped chrome around it, plus the two things the SDK deliberately does not decide —
 * what happens when an asset is chosen, and where the credential lives.
 */
function Browser({
  config,
  onPick,
  pickLabel,
}: {
  config: RasterConfig;
  onPick?: (item: RasterItem) => void;
  pickLabel: string;
}) {
  const client = useRasterClient();
  const { userName, isSignedIn, signOut } = useSession();

  const allOrganizations = useOrganizations();
  const pinned = pinnedOrganizationId(config);

  // A configured organization pins the plugin to it: the switcher then has nothing to switch
  // to and renders as just the Raster mark, which is the behaviour studios that set `orgId`
  // already had.
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

  const upload = useAssetUpload();

  const [selected, setSelected] = useState<RasterItem | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDropping, setIsDropping] = useState(false);

  // Opening an asset starts with the asset itself selected, so the detail pane is never empty
  // and the default is what an editor sees first.
  useEffect(() => {
    setSelected(nav.asset);
  }, [nav.asset]);

  /** The library an asset belongs to — a search hit's is not the one being browsed. */
  const assetLibraryId = nav.asset?.libraryId ?? nav.library?.id ?? null;

  const refresh = useCallback(() => {
    nav.refresh();
    allOrganizations.reload();
    libraries.reload();
    assets.reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav.refresh, allOrganizations.reload, libraries.reload, assets.reload]);

  // ---- upload ---------------------------------------------------------------------------

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Which asset an upload should attach to as a variant, or null for a new top-level asset.
  const uploadParentRef = useRef<string | null>(null);

  const openFilePicker = useCallback((parentId: string | null) => {
    uploadParentRef.current = parentId;
    fileInputRef.current?.click();
  }, []);

  const uploadFile = useCallback(
    async (file: File, parentId: string | null) => {
      // An asset opened from a search hit belongs to a library other than the one being
      // browsed — and may be the only library in play, since a search can start from the list.
      const libraryId = assetLibraryId;
      if (nav.organizationId === null || libraryId === null) return;

      setError(null);
      const finished = await upload.upload({
        organizationId: nav.organizationId,
        libraryId,
        parentId,
        source: file,
      });

      // Null means processing outlived the poll schedule — "not yet", not a failure. The
      // upload itself is done, so refreshing later will find it.
      if (finished === null) return;

      if (parentId === null) {
        // Listings lag behind processing by a few seconds, so show it now rather than reload
        // and appear to have lost it. A later reload overwrites this with the server's order.
        assets.setAssets((current) => [finished, ...current.filter((a) => a.id !== finished.id)]);
        return;
      }

      // A new variant reshapes the parent, so take the parent back from the server rather
      // than splice a guess into the list we are holding.
      try {
        const parent = await client.assets.get({
          organizationId: nav.organizationId,
          libraryId,
          assetId: parentId,
        });
        nav.openAsset(parent);
        assets.setAssets((current) => current.map((a) => (a.id === parent.id ? parent : a)));
      } catch (caught) {
        setError(toUserMessage(caught));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, nav.organizationId, nav.openAsset, assetLibraryId, upload.upload, assets.setAssets]
  );

  // Somewhere to upload to: a library being browsed, or the library the open asset came from.
  const canUpload = nav.organizationId !== null && assetLibraryId !== null;

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDropping(false);
    const file = event.dataTransfer?.files?.[0];
    if (file === undefined || !canUpload) return;
    void uploadFile(file, nav.asset?.id ?? null);
  };

  // ---- promote --------------------------------------------------------------------------

  const promote = useCallback(
    async (variant: AssetVariant) => {
      const asset = nav.asset;
      if (asset === null || nav.organizationId === null || assetLibraryId === null) return;

      setBusy("promote");
      setError(null);
      try {
        await client.assets.promote({
          organizationId: nav.organizationId,
          libraryId: assetLibraryId,
          assetId: asset.id,
          variantId: variant.id,
        });

        // Promote swaps the file behind a stable URL, so the grid behind this view would keep
        // painting the old bytes from cache. The display override shows the promoted image at
        // once, and the version bump is what stops the cache winning.
        assets.setAssets((current) =>
          current.map((item) =>
            item.id === asset.id
              ? {
                  ...item,
                  displayUrl: variant.url,
                  displaySizes: variant.sizes,
                  contentVersion: (item.contentVersion ?? 0) + 1,
                }
              : item
          )
        );

        // The previous default is preserved as a new variant and the promoted one's entry
        // goes away, so the variant list we are holding no longer matches. Refetch.
        const fresh = await client.assets.get({
          organizationId: nav.organizationId,
          libraryId: assetLibraryId,
          assetId: asset.id,
        });
        nav.openAsset(fresh);
      } catch (caught) {
        setError(toUserMessage(caught));
      } finally {
        setBusy(null);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [client, nav.asset, nav.organizationId, nav.openAsset, assetLibraryId, assets.setAssets]
  );

  // ---- what the grid shows ---------------------------------------------------------------

  const libraryName = useCallback(
    (libraryId: string | null | undefined) =>
      libraries.data?.find((library) => library.id === libraryId)?.name ?? null,
    [libraries.data]
  );

  /** The asset's default first, then its variants, then a placeholder for one being made. */
  const variantItems = useMemo<Array<RasterItem>>(() => {
    if (nav.asset === null) return [];
    const items: Array<RasterItem> = [nav.asset, ...(nav.asset.variants ?? [])];

    if (upload.state.status === "processing" && upload.state.asset.parentId === nav.asset.id) {
      const pending = upload.state.asset;
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
  }, [nav.asset, upload.state]);

  const handleTile = (item: RasterItem) => {
    // In the asset view a click chooses which version the detail pane is about.
    if (nav.asset !== null) {
      setSelected(item);
      return;
    }
    // In the picker, an asset with no variants is one click: there is nothing to choose
    // between, and making an editor open it first would be ceremony.
    const hasVariants = "variants" in item && (item.variants?.length ?? 0) > 0;
    if (onPick !== undefined && !hasVariants) {
      onPick(item);
      return;
    }
    nav.openAsset(item as Asset);
  };

  // ---- chrome ---------------------------------------------------------------------------

  const crumbs: Array<Crumb> = [
    {
      key: "organization",
      label: organization?.name ?? "Raster",
      onClick: nav.library === null ? undefined : () => nav.openLibrary(null),
    },
  ];
  if (nav.library !== null) {
    crumbs.push({
      key: "library",
      label: nav.library.name ?? "Library",
      onClick: nav.asset === null ? undefined : () => nav.openAsset(null),
    });
  }
  if (nav.asset !== null) {
    crumbs.push({ key: "asset", label: nav.asset.name ?? "Asset" });
  }

  const pinnedMissing =
    pinned !== null && allOrganizations.data !== null && (organizations?.length ?? 0) === 0;

  if (pinnedMissing) {
    return (
      <div className="rstr-sanity-stack rstr-sanity-gap-4 rstr-sanity-pad-4">
        <Card tone="critical" padding={3} radius={2} border>
          <Text size={1}>
            This Raster credential cannot reach the organization <code>{pinned}</code> that this
            studio is configured for.
          </Text>
        </Card>
        <Button mode="ghost" fontSize={1} icon={LeaveIcon} text="Sign out" onClick={() => void signOut()} />
      </div>
    );
  }

  // `isRestored` is false until the remembered organization and library have been read back.
  // Rendering the library list first and then jumping into a library is worse than waiting.
  if (organizations === null || !nav.isRestored) {
    return <LoadingScreen label="Loading your Raster libraries…" />;
  }

  const searchHint = search.active
    ? search.isSearching
      ? "Searching…"
      : `${search.found} ${search.found === 1 ? "result" : "results"}`
    : undefined;

  return (
    <>
      <div className="rstr-sanity-header">
        <OrganizationMenu
          organizations={organizations}
          current={organization}
          onSelect={(next) => nav.selectOrganization(next.id)}
        />
        <Breadcrumb crumbs={crumbs} />
        <span className="rstr-sanity-header__spacer" />

        {canUpload && (
          <Button
            mode="ghost"
            fontSize={1}
            padding={2}
            icon={UploadIcon}
            text={nav.asset === null ? "Upload" : "Add a variant"}
            disabled={upload.state.status === "uploading"}
            loading={upload.state.status === "uploading"}
            onClick={() => openFilePicker(nav.asset?.id ?? null)}
          />
        )}
        <Button
          mode="bleed"
          fontSize={1}
          padding={2}
          icon={RefreshIcon}
          title="Refresh"
          aria-label="Refresh"
          onClick={refresh}
        />
        <Button
          mode="bleed"
          fontSize={1}
          padding={2}
          icon={LeaveIcon}
          text="Sign out"
          title={
            isSignedIn
              ? `Signed in as ${userName ?? "your Raster account"}`
              : "Connected with an organization API key"
          }
          onClick={() => void signOut()}
        />
      </div>

      {nav.asset === null && nav.organizationId !== null && (
        <SearchBar
          value={nav.query}
          onChange={nav.setQuery}
          placeholder={
            nav.library === null
              ? `Search ${organization?.name ?? "this organization"}`
              : `Search ${nav.library.name ?? "this library"}`
          }
          hint={searchHint}
        />
      )}

      {(error !== null || upload.state.status === "error") && (
        <Card tone="critical" padding={3} radius={2} border>
          <Text size={1}>{error ?? (upload.state.status === "error" ? upload.state.message : "")}</Text>
        </Card>
      )}

      {(upload.state.status === "uploading" || upload.state.status === "processing") && (
        <Card tone="primary" padding={3} radius={2} border>
          <Text size={1}>
            {upload.state.status === "uploading"
              ? "Uploading to Raster…"
              : `Raster is processing ${upload.state.asset.name ?? "the upload"}. It will appear in a moment.`}
          </Text>
        </Card>
      )}

      <div
        className="rstr-sanity-browser__body"
        onDragOver={(event) => {
          if (!canUpload) return;
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
        onDrop={onDrop}
      >
        {isDropping && (
          <div className="rstr-sanity-browser__drop">
            {nav.asset === null
              ? `Drop to upload to ${nav.library?.name ?? "this library"}`
              : `Drop to add a variant of ${nav.asset.name ?? "this asset"}`}
          </div>
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
          <div className="rstr-sanity-detail">
            <div className="rstr-sanity-stack rstr-sanity-gap-3">
              <Text size={1} muted>
                {variantItems.length === 1
                  ? "This asset has no variants yet."
                  : `The default, and ${variantItems.length - 1} ${
                      variantItems.length === 2 ? "variant" : "variants"
                    }.`}
              </Text>
              <AssetGrid
                assets={variantItems}
                onSelect={(item) => handleTile(item as RasterItem)}
                defaultAssetId={nav.asset.id}
                emptyMessage="Nothing to show."
              />
            </div>
            {selected !== null && (
              <AssetDetail
                item={selected}
                canPromote={selected.id !== nav.asset.id && !isProcessing(selected)}
                onPromote={() => void promote(selected as AssetVariant)}
                onPick={onPick}
                pickLabel={pickLabel}
                onUploadVariant={
                  assetLibraryId === null ? undefined : () => openFilePicker(nav.asset?.id ?? null)
                }
                busy={busy}
              />
            )}
          </div>
        ) : (
          <AssetGrid
            assets={assets.assets}
            isLoading={assets.isLoading}
            error={assets.error}
            hasMore={assets.hasMore}
            onLoadMore={assets.loadMore}
            onSelect={(item) => handleTile(item as RasterItem)}
            emptyMessage={
              canUpload ? "This library is empty. Drop an image here to upload it." : "Nothing here yet."
            }
          />
        )}
      </div>

      <input
        ref={fileInputRef}
        className="rstr-sanity-visually-hidden"
        type="file"
        accept="image/*"
        tabIndex={-1}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          // Cleared so choosing the same file twice in a row still fires a change event.
          event.currentTarget.value = "";
          if (file !== undefined) void uploadFile(file, uploadParentRef.current);
        }}
      />
    </>
  );
}
