import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getBlurhashPlaceholder, getThumbUrl, isReady, type DisplayAsset } from "@raster/sdk";
import { Badge, Box, Card, Flex, Grid, Text } from "@sanity/ui";
import { LoadingState } from "./loading-state";

export type AssetGridProps<T extends DisplayAsset> = {
  /** Null means "not loaded yet", which is not the same as an empty library. */
  assets: Array<T> | null;
  onSelect?: (asset: T) => void;
  isLoading?: boolean;
  error?: string | null;
  hasMore?: boolean;
  onLoadMore?: () => void;
  /** Per-asset badge: the hit's library, when a search spans several. */
  badgeFor?: (asset: T) => string | null;
  /** Marks one asset as the current default. */
  defaultAssetId?: string | null;
  emptyMessage?: ReactNode;
};

/**
 * The asset grid, with infinite paging. Paging is driven by an `IntersectionObserver` on a
 * sentinel after the last row rather than a button, because these panels are narrow and a
 * "load more" button is most of a row.
 */
export function AssetGrid<T extends DisplayAsset>({
  assets,
  onSelect,
  isLoading = false,
  error = null,
  hasMore = false,
  onLoadMore,
  badgeFor,
  defaultAssetId,
  emptyMessage = "Nothing here yet.",
}: AssetGridProps<T>) {
  /** Refs */
  const sentinelRef = useRef<HTMLDivElement>(null);
  // `onLoadMore` is usually an inline arrow. Held in a ref so the observer below is not torn
  // down and rebuilt on every render, which can miss the intersection that should have paged.
  const loadMoreRef = useRef(onLoadMore);

  /** Effects */
  useEffect(() => {
    loadMoreRef.current = onLoadMore;
  });

  useEffect(() => {
    // Only observe once there is something to page past: a sentinel in an empty container is
    // already intersecting, and would fetch a page nobody asked for.
    if (!hasMore || isLoading || assets === null) return;
    const sentinel = sentinelRef.current;
    if (sentinel === null) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadMoreRef.current?.();
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, assets]);

  /** Early returns */
  if (error !== null) {
    return (
      <Card tone="critical" padding={3} radius={2} border>
        <Text size={1}>{error}</Text>
      </Card>
    );
  }

  if (assets === null) return <LoadingState label="Loading assets…" />;

  if (assets.length === 0 && !isLoading) {
    return (
      <Box padding={4}>
        <Text size={1} muted>
          {emptyMessage}
        </Text>
      </Box>
    );
  }

  return (
    <>
      <Grid gap={3} style={{ gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
        {assets.map((asset) => (
          <AssetTile
            key={asset.id}
            asset={asset}
            onSelect={onSelect}
            badge={badgeFor?.(asset) ?? null}
            isDefault={defaultAssetId === asset.id}
          />
        ))}
      </Grid>
      {hasMore && <div ref={sentinelRef} aria-hidden="true" style={{ height: 1 }} />}
      {isLoading && <LoadingState label="Loading more…" />}
    </>
  );
}

/**
 * One asset. The frame reserves the asset's aspect ratio before the image loads, so the grid
 * does not reflow as images land, and paints the blurhash underneath so it is never an empty
 * box. An asset still processing is shown but disabled.
 */
function AssetTile<T extends DisplayAsset>({
  asset,
  onSelect,
  badge,
  isDefault,
}: {
  asset: T;
  onSelect?: (asset: T) => void;
  badge: string | null;
  isDefault: boolean;
}) {
  /** State */
  const [loaded, setLoaded] = useState(false);

  /** Derived */
  const src = getThumbUrl(asset);
  const placeholder = useMemo(() => getBlurhashPlaceholder(asset), [asset]);
  const ready = isReady(asset);
  // A square only when the API has not reported dimensions, which is while it processes.
  const ratio = asset.width && asset.height ? `${asset.width} / ${asset.height}` : "1 / 1";

  return (
    <Card
      as="button"
      type="button"
      padding={1}
      radius={2}
      border
      disabled={!ready || onSelect === undefined}
      onClick={ready && onSelect ? () => onSelect(asset) : undefined}
      title={asset.name ?? undefined}
      aria-label={ready ? (asset.name ?? "Asset") : `${asset.name ?? "Asset"}, still processing`}
      style={{ textAlign: "left" }}
    >
      <Flex direction="column" gap={2}>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 3,
            aspectRatio: ratio,
            backgroundImage: placeholder ? `url(${placeholder})` : undefined,
            backgroundSize: "cover",
          }}
        >
          {src !== undefined && (
            <img
              src={src}
              alt=""
              loading="lazy"
              decoding="async"
              onLoad={() => setLoaded(true)}
              // A broken image should still reveal the blurhash rather than an alt-text box.
              onError={() => setLoaded(false)}
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: loaded ? 1 : 0,
                transition: "opacity 150ms ease-out",
              }}
            />
          )}
          <Flex gap={1} wrap="wrap" style={{ position: "absolute", top: 4, left: 4, right: 4 }}>
            {badge !== null && badge !== "" && <Badge>{badge}</Badge>}
            {!ready && <Badge>Processing</Badge>}
            {isDefault && <Badge tone="primary">Default</Badge>}
          </Flex>
        </div>
        <Box paddingX={1} paddingBottom={1}>
          <Text size={1} textOverflow="ellipsis">
            {asset.name ?? asset.id}
          </Text>
        </Box>
      </Flex>
    </Card>
  );
}
